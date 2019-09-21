import React, { Component } from 'react';
import { zipSamples, MuseClient } from 'muse-js';
import axios from 'axios';
import { powerByBand, epoch, fft } from '@neurosity/pipes';
import Visualization from './Visualization';
import './App.css';

class App extends Component {
  state = {
    status: false,
    telemetry: {},
    data: {},
    showVisualization: true,
    demoType: 'visualization'
  };

  subscribeToMuse = async () => {
    try {
      const client = new MuseClient();

      client.enableAux = false;

      client.connectionStatus.subscribe(status => this.setState({ status }));

      await client.connect();
      await client.start();

      client.telemetryData.subscribe(telemetry => this.setState({ telemetry }));
      zipSamples(client.eegReadings)
        .pipe(
          epoch({ duration: 1024, interval: 100, samplingRate: 256 }),
          fft({ bins: 256 }),
          powerByBand()
        )
        .subscribe(data => {
          this.setState({ data });
        });
    } catch (err) {
      console.error('Connection failed', err);
    }
  };

  componentDidMount() {
    this.postData()
    setInterval(this.postData, 10000);
  }

  async postData() {
    const { data } = this.state;
    try {
      const response = await axios.post(
        'http://projectfocus.appspot.com/snapshot',
        {
          user: "chrisb",
          alpha: data.alpha,
          beta: data.beta,
          delta: data.delta,
          gamma: data.gamma,
          theta: data.theta
        },
      );
      console.log(response.data);
    } catch (e) {
      console.log(e);
    }
  }


  getAverageGamma = _ => {
    const { data } = this.state;

    if (data.gamma) {
      const focus = data.gamma.reduce((sum, x) => sum + x) / data.gamma.length;
      return focus;
    }

    return 0;
  };

  getAverageAlpha = _ => {
    const { data } = this.state;

    if (data.alpha) {
      return 1 / (data.alpha.reduce((sum, x) => sum + x) / data.alpha.length);
    }

    return 0;
  };

  renderVisualization = _ => {
    const { data } = this.state;
    document.body.style = 'background: white; color: black;';
    return (
      <div style={{ display: 'flex' }}>
        <Visualization
          data={data.gamma}
          labels={['Gamma']}
          backgroundColor="#BDD6EA"
        />
        <Visualization
          data={data.beta}
          labels={['Beta']}
          backgroundColor="#B4C493"
        />
        <Visualization
          data={data.alpha}
          labels={['Alpha']}
          backgroundColor="#F1C387"
        />
        <Visualization
          data={data.theta}
          labels={['Theta']}
          backgroundColor="#EFB180"
        />
        <Visualization
          data={data.delta}
          labels={['Delta']}
          backgroundColor="#E19271"
        />
      </div>
    );
  };

  renderDemoType = _ => {
    const { demoType } = this.state;
    return this.renderVisualization();
  };

  handleDemoTypeChange = e => {
    this.setState({ demoType: e.target.className });
  };

  render() {
    const { status, telemetry, demoType } = this.state;

    const statusText = status ? 'Connected' : 'Disconnected';
    const batteryLevel = telemetry.batteryLevel || 0;

    return (
      <div>
        <ul>
          <li
            className={`${demoType === 'visualization' ? 'active' : ''}`}
            onClick={this.handleDemoTypeChange}
          >
            <div className="visualization">Visualization</div>
          </li>
          <li style={{ float: `right`, display: `flex` }}>
            <div onClick={this.subscribeToMuse} disabled={status}>
              Connect
            </div>
            <div style={{ color: `white` }}>Battery: {batteryLevel}%</div>
            <div>Status: {statusText}</div>
          </li>
        </ul>
        <div style={{ paddingTop: `70px` }}>{this.renderDemoType()}</div>
      </div>
    );
  }
}

export default App;
