import React from 'react';
import $ from 'jquery';
import Pubsub from 'pubsub-js';
import { SliderComponent } from './slider.jsx!';
import { SavingsLength } from './calculations.jsx!';
import d3 from 'd3';
import csv from 'csv';
import csvData from './data/data.csv!text';
import topoJson from './data/lga.json!';
import topojson from 'topojson';


export class Application {

    constructor(){
        L.mapbox.accessToken = 'pk.eyJ1IjoiZ3VhcmRpYW5hdXMiLCJhIjoidXp3UFpTTSJ9.gRE4cwQj5wWSV50AFJslOw';
        var self = this;
        this.currentState = "NSW";
        this.typeIndex = 2;

        React.render(React.createElement(SliderComponent), document.getElementById('sliderComponent'));
        React.render(React.createElement(SavingsLength), document.getElementById('resultsContainer'));
        this.handleSaving = this.handleSaving.bind(this);
        Pubsub.subscribe('saving', this.handleSaving);

        $('.roles-row li').on('click', function(){
            setTimeout(()=>{
                self.drawLayers();
                self.processCharts();
            }, 500);

            if(this.getAttribute('data-week-saving') || this.getAttribute('data-mean-price') || this.getAttribute('data-type')){

                if(this.getAttribute('data-type')){
                    self.addActive(this);
                    Pubsub.publish('unit-type', this.getAttribute('data-type'));
                    switch(this.getAttribute('data-type')){
                        case "house":
                            self.typeIndex = 2;
                            document.getElementById('house-unit').textContent = "house";
                            break;
                        case "unit":
                            self.typeIndex = 3;
                            document.getElementById('house-unit').textContent = "unit";
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
                    self.lon = JSON.parse(this.getAttribute('data-mean-price')).lon;
                    self.lat = JSON.parse(this.getAttribute('data-mean-price')).lat;
                    self.currentState = JSON.parse(this.getAttribute('data-mean-price')).state;
                    document.getElementById('city').textContent = JSON.parse(this.getAttribute('data-mean-price')).capital;
                    self.processCharts();
                    self.setLatLong();
                    return;
                }

                if(self.you){
                    $('body').removeClass('js-you');
                    Pubsub.publish('you');
                    self.you = false;
                    document.getElementById('theyd').textContent = "They'd";
                }
            }

            if(this.getAttribute('data-you') == 'true'){
                if(self.you){
                    return;
                }
                $('body').addClass('js-you');
                Pubsub.publish('you')
                self.you = true;
                document.getElementById('theyd').textContent = "You'd";
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
            this.paintMap();
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
        let data = this.sortData(index)
        let array = [];
        data.sort(function(a,b){
            return parseInt(b[index])-parseInt(a[index]);
        });
        for(var i=0;i<data.length;i++){

            if(i<5){
                console.log(data[i][index]);
                array.push({"suburb": data[i][1], "price": data[i][index], "timeToPayOff": this.getSavingsLength(Application.savings,  parseInt(data[i][index])).payOffTime});
            }
            
        }
        return array;
    }

    getBottomFive(index){
        let data1 = this.sortData(index);
        let data2 = data1.splice(data1.length-5,data1.length);

        let array = [];
        data2.forEach((item)=>{

            array.push({"suburb": item[1], "price": item[index], "timeToPayOff": this.getSavingsLength(Application.savings, parseInt(item[index])).payOffTime})
        });        
        array.sort(function(a,b){
            return b.price-a.price;
        });
        return array.reverse();
    }

    setLatLong(){
       this.map.setView([this.lat, this.lon], 9);
    }

    drawLayers(){
        var color = ['#ffffb2','#bd0026'];
        var scaleColor = d3.scale.linear()
            .range(color);
        var range = [];

        this.layers.eachLayer((item)=>{
            this.data.forEach((house)=>{
                if (house[4] == item.feature.properties.LGA_CODE14){
                    var payOffTime = this.getSavingsLength(Application.savings,parseInt(house[2])).payOffTime;
                    range.push(payOffTime);
                }
            });
        });
        var catExtent = d3.extent(range);
        scaleColor.domain(catExtent);
        console.log(this.map);
        this.layers.eachLayer((item)=>{
            this.data.forEach((house)=>{
                if (house[4] == item.feature.properties.LGA_CODE14){
                    var payOffTime = this.getSavingsLength(Application.savings,parseInt(house[2])).payOffTime;
                    item.name = house[1];
                    if(item.name == "Brisbane"){
                        console.log("Brisbane")
                    }
                    item.payOffTime = payOffTime;
                    item.setStyle({
                        fillColor: scaleColor(payOffTime),
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWidth: 2,
                        weight: 0.8,
                        name: house[1],
                        payOffTime: payOffTime

                    });
                }
            });
        });

    }
    handleSaving(){
        this.changingSaving = true;
        setTimeout(()=>{
            this.changingSaving = false;
        },10);
        setTimeout(()=>{
            if(!this.changingSaving){
                this.drawLayers();
                this.processCharts();
            }
        }, 500);
    }

    paintMap(){
        var width = $("#mapContainer").width();
        var height = width*0.581;
        var features = (topojson.feature(topoJson, topoJson.objects.lgas).features);
        this.map = L.mapbox.map('mapContainer', 'guardianaus.0963bc53').setView([-34, 151], 8);
        var map = this.map;
        this.topology = omnivore.topojson.parse(topoJson);
        this.layers = L.mapbox.featureLayer(this.topology).addTo(map);
        this.drawLayers()

        this.layers.on("click", (e)=>{
            if(e.layer.options.name){
                this.popup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent("<b>Suburb:</b> " + e.layer.options.name + " <br> <b>Deposit will take </b> " + e.layer.options.payOffTime + "  years to save")
                    .openOn(map);
            }
        });
    }


    getSavingsLength(savingAmountByWeek, aveHousePrice){
        var deposit = 0.2*aveHousePrice;
        var interestRateWk = 0.02/52;
        var weeks = 0;
        var savings = savingAmountByWeek + 0;

        while (savings < deposit) {
            savings = savings + savingAmountByWeek + (savings*interestRateWk);
            weeks++;
        }

        var years = (weeks/52).toFixed(1);
        var weeks = weeks;
        var days = weeks * 7;
        var hours = Math.floor(days)*24;
        var remainingWeeks = weeks % 52;
        var payOffTime = {"payoffTimeStr":years + " years","payOffTime":parseFloat(years)};
        return payOffTime;
    }

    paintGraph(id, data){
        console.log(data);
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
        y.domain([0, d3.max(data, function(d) { return d.timeToPayOff })]);

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
            .text("years");

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
            .attr("y", function(d) { return y(d.timeToPayOff); })
            .attr("height", function(d) { return height - y(d.timeToPayOff); });

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
Application.savings = 412;
var App = new Application();