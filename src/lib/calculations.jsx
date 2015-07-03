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
            days: 0
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

    componentDidMount(){
        console.log(this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice));
    }

    handleSaving(event, saving){
        this.setState({
            defaultWeek: parseInt(saving)
        });
        this.getSavingsLength(this.state.defaultWeek, this.state.defaultMeanPrice)
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
        this.setState({
            payOffTime: payOffTime.payOffTime,
            weeks: weeks,
            days: this.numberWithCommas(Math.floor(days)),
            hours: this.numberWithCommas(hours)

        });
        return payOffTime;
    }

    render(){

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
            </h1>
        )
    }
}