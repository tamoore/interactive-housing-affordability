import React from 'react';
import $ from 'jquery';
import Pubsub from 'pubsub-js';

import { SliderComponent } from './slider.jsx!';
import { SavingsLength } from './calculations.jsx!';

import d3 from 'd3';
import csv from 'csv';
import csvData from './data/data.csv!text';

class Application {

    constructor(){

        var self = this;
        this.currentState = "NSW";
        this.typeIndex = 2;

        React.render(React.createElement(SliderComponent), document.getElementById('sliderComponent'));
        React.render(React.createElement(SavingsLength), document.getElementById('resultsContainer'));

        $('.roles-row li').on('click', function(){

            if(this.getAttribute('data-week-saving') || this.getAttribute('data-mean-price') || this.getAttribute('data-type')){

                if(this.getAttribute('data-type')){
                    self.addActive(this);
                    Pubsub.publish('unit-type', this.getAttribute('data-type'));
                    switch(this.getAttribute('data-type')){
                        case "house":
                            self.typeIndex = 2;
                            break;
                        case "unit":
                            self.typeIndex = 3;
                            break;
                    }
                    self.processCharts();
                    return;
                }

                self.addActive(this)
                if(this.getAttribute('data-week-saving')){
                    Pubsub.publish('saving', this.getAttribute('data-week-saving'));
                }

                if(this.getAttribute('data-mean-price')){

                    Pubsub.publish('mean-price', this.getAttribute('data-mean-price'));
                    self.currentState = JSON.parse(this.getAttribute('data-mean-price')).state;
                    self.processCharts();
                    return;
                }

                if(self.you){
                    $('body').removeClass('js-you');
                    Pubsub.publish('you');
                    self.you = false;
                }




            }



            if(this.getAttribute('data-you') == 'true'){
                if(self.you){
                    return;
                }
                $('body').addClass('js-you');
                Pubsub.publish('you')
                self.you = true;
                self.processCharts();
                return;
            }

            if(!this.getAttribute('data-week-saving') && self.you){
                $(this).parent().find('li').removeClass('active');
                $(this).addClass('active');
            }



        });

        csv.parse(csvData, (err, output)=>{
            if(err){ console.log(err); return; }
            this.data = output;
            this.setupCharts();
        });

    }

    addActive(elment){
        $(elment).parent().find('li').removeClass('active');
        $(elment).addClass('active');
    }

    processCharts(){
        document.getElementById("chart-top5").innerHTML = "";
        document.getElementById("chart-bottom5").innerHTML = "";
        this.setupCharts();
    }

    get currentState(){
        return this.state;
    }
    set currentState(state){
        this.state = state;
    }

    sortData(index){
        return this.fileredData.sort((a,b)=>{
            if (parseInt(a[index]) > parseInt(b[index])) {
                return 1;
            }
            if (parseInt(a[index]) < parseInt(b[index])) {
                return -1;
            }
            // a must be equal to b
            return 0;
        }).filter((item)=>{
            return item[index].length
        }).reverse();

    }
    getTopFive(index){
        let data = this.sortData(index).splice(0,5);
        let array = [];
        data.forEach((item)=>{
            array.push({"suburb": item[1], "price": item[index]})
        });
        return array;
    }

    getBottomFive(index){
        let data = this.sortData(index)
            data =data.splice(data.length-5,data.length);
        let array = [];
        data.forEach((item)=>{
            array.push({"suburb": item[1], "price": item[index]})
        });
        return array.reverse();
    }

    paintGraph(id, data){
        var getW = document.getElementById(id).clientWidth;
        var getH = 300;

        var margin = {top: 10, right: 10, bottom: 30, left: 25},
            width = getW - margin.left - margin.right,
            height = getH;

        var svg = d3.select("#"+id).append("svg")
            .attr("width", width )
            .attr("height", height )
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.ordinal()
            .rangeBands([0, width],0.2);

        var y = d3.scale.linear()
            .range([height,0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        x.domain(data.map(function(d) { return d.suburb; }))
        y.domain([0, d3.max(data, function(d) { return parseInt(d.price); })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .attr("class", "axis")
            .style("text-anchor", "end")
            .text("");

        var graphBars = svg.selectAll(".bar")
            .data(data, function(d) { return d.suburb});
        graphBars
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.suburb)})
            .attr("class", "bar")
            .attr("width", x.rangeBand())
            .attr("y", height)
            .attr("height", 0)

        graphBars
            .transition()
            .duration(2000)
            .attr("y", function(d) { return y(d.price); })
            .attr("height", function(d) { return height - y(d.price); });

        graphBars.exit()
            .transition()
            .attr("y", function(d) { return height;})
            .attr("height", 0);
    }

    setupCharts(){
        console.log(this.typeIndex);
        document.getElementById('state-label').textContent = this.currentState;
        this.fileredData = this.data.filter((item)=>{
            return item[0] == this.currentState;
        });

        var houseDataTop5 = this.getTopFive(this.typeIndex);
        var houseDataBottom5 = this.getBottomFive(this.typeIndex);
        this.paintGraph("chart-top5", houseDataTop5);
        this.paintGraph("chart-bottom5", houseDataBottom5);


    }


}
var App = new Application();