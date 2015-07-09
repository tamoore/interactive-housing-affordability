import React from 'react';
import Pubsub from 'pubsub-js';
import { Application } from './index';

export class SavingsLength extends React.Component {
    constructor(){
        super();


        this.handleMeanPrice = this.handleMeanPrice.bind(this);
        this.handleSaving = this.handleSaving.bind(this);
        this.currentUnitType = "house";
        this.currentData = {"capital":"Sydney","house":914056,"unit":609800,"state":"NSW"};
        this.state = {
            defaultWeek: 300,
            defaultMeanPrice: 914056,
            payOffTime: 0,
            weeks: 0,
            days: 0,
            funFact: {}

        }
        Pubsub.subscribe('mean-price', this.handleMeanPrice);
        Pubsub.subscribe('saving', this.handleSaving);
        Pubsub.subscribe('unit-type', (event, unit)=>{

            this.currentUnitType = unit;
            this.setState({
                unit: unit,
                defaultMeanPrice: parseInt(this.currentData[this.currentUnitType])
            })
            this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice)
        });
    }
    getTimeToMars(timeInYears){
        return { value: Math.floor((timeInYears*364)/253) + " times", class:"mars", text: "If you were travelling at the same speed as curiosity, you could go to Mars","img": "images/rocket.svg" };
    }
    getSlothTime(timeInYears){
        return { value: Math.floor(((timeInYears * 8765.81) * 1.944) / 40075) + " times", class:"sloth", text: "If a sloth tried to circumnavigate the globe they would do it","img": "images/sloth.svg"};
    }

    getPineTreeHeight(timeInYears){

        return { value: Math.floor(-0.016*Math.pow(timeInYears,2) + 1.5457*timeInYears+0.592) + "m", class:"pine", text: "A gum tree could grow to a majestic height of","img": "images/tree.svg"};
    }

    getMedicine(timeInYears){
        return {value: Math.floor((timeInYears/6)) +" times", class:"medicine", text: "If you started now, you would achieve a Medicine degree", "img": "images/medicine.svg"};
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    componentDidMount(){
        console.log(this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice));
    }

    handleSaving(event, saving){
        if(Application){
            Application.savings = parseInt(saving);
            console.log(Application.savings)
        }
        this.setState({
            defaultWeek: parseInt(saving)
        });
        setTimeout(()=>{
            this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice);
        }, 2000);

    }

    handleMeanPrice(event, data){
        let result = JSON.parse(data);
        this.currentData = result;
        this.setState({
            defaultMeanPrice: parseInt(result[this.currentUnitType])
        });
        this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice)
    }

    numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    getSavingsLength(savingAmountByWeek, aveHousePrice){
        var deposit = 0.2*aveHousePrice;
        var interestRateWk = 0.02/52;
        var weeks = 0;
        var savings = savingAmountByWeek + 0;
        var options = [this.getTimeToMars, this.getMedicine, this.getPineTreeHeight, this.getSlothTime];


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
        var randomIndex = Math.floor(this.getRandomArbitrary(0,4));

        this.setState({
            payOffTime: payOffTime.payOffTime,
            weeks: weeks,
            days: this.numberWithCommas(Math.floor(days)),
            hours: this.numberWithCommas(hours),
            funFact: options[randomIndex].apply(this, [payOffTime.payOffTime])
        });
        return payOffTime;
    }

    render(){
        var style = {
            float: 'right',
            height: 'auto'


        }
      return  (
            <h1>
                <span>{this.state.payOffTime}</span>
                <figure className="years">

                </figure>
                <figure className="extra">
                    <ul>
                        <li className="weeks">{this.state.weeks}</li>
                        <li className="days">{this.state.days}</li>
                        <li className="hours">{this.state.hours}</li>

                    </ul>
                </figure>
                <figure className="fun-facts">
                    <ul>
                        <li className={this.state.funFact.class}>

                            <p><span>{this.state.funFact.text}</span></p>
                            <p>{this.state.funFact.value}</p>

                            <img src={this.state.funFact.img} style={style} />
                        </li>
                    </ul>
                </figure>
            </h1>
        )
    }
}