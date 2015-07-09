import React from 'react';
import { Application } from './index';
import Pubsub from 'pubsub-js';


export class SliderComponent extends React.Component {
    constructor() {
        super();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleYou = this.handleYou.bind(this);
        this.handleSaving = this.handleSaving.bind(this);

        this.state = {
            savings: 412,
            savingsInput: "412",
            savingsClass: "percent412",
            styles: {
                display: "none"
            }

        }
        Pubsub.subscribe('you', this.handleYou)
        Pubsub.subscribe('saving', this.handleSaving);
    }

    debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    componentDidMount(){
        var input = React.findDOMNode(this.refs.rangeInput);
        var debounce = this.debounce((event)=>{
            this.handleInputChange(event);
        }, 50);
        input.addEventListener('change', debounce);
    }

    handleSaving(eventName, amount){
        if(Application){
            Application.savings = parseInt(amount);
            console.log(Application.savings)
        }
        this.setState({
            savings: parseInt(amount),
            savingsInput: amount
        });
    }


    handleYou(){
        if(this.state.styles.display == "none"){
            this.setState({
                styles: {
                    display: "block"
                }
            });
        }else{
            this.setState({
                styles: {
                    display: "none"
                }
            });
        }
    }

    handleInputChange(event){
        this.setState({
            savings: event.target.value,
            savingsInput:  event.target.value,
            savingsClass: "percent" + event.target.value
        })
        Pubsub.publish('saving', event.target.value);
    }

    render(){
    //onChange={this.handleInputChange} onInput={this.handleInputChange}
        return (
            <div>
                <figure className="savingsAmount">
                    {this.state.savingsInput}
                </figure>
                <div id="slider" style={this.state.styles}>
                    <input type="range" className={this.state.savingsClass} ref="rangeInput" min="25" value={this.state.savings} max="2000" step="25" />
                </div>
            </div>
        )
    }

}
