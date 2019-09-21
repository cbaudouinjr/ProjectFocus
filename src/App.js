import React, { Component } from 'react';
import { zipSamples, MuseClient } from 'muse-js';
import { powerByBand, epoch, fft } from '@neurosity/pipes';
import Visualization from './Visualization';
import './App.css';
import { UserSession } from "blockstack";
import { appConfig } from "./constants";

class App extends Component {
  state = {
    status: false,
    telemetry: {},
    data: {},
    showVisualization: true,
    demoType: 'visualization',
    userSession: new UserSession({ appConfig })
  };

    componentDidMount = async () => {
      const { userSession } = this.state;
  if (!userSession.isUserSignedIn() && userSession.isSignInPending()) {
        const userData = await userSession.handlePendingSignIn();
  if (!userData.username) {
          throw new Error("This app requires a username");
        }
  window.location = "/";
      }
    };

  handleSignIn = () => {
      const { userSession } = this.state;
      userSession.redirectToSignIn();
    };

  handleSignOut = () => {
      const { userSession } = this.state;
      userSession.signUserOut();
      window.location = "/";
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

    const { status, telemetry, demoType, userSession } = this.state;
    

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


            <div className="blockstackbutton">
              {userSession.isUserSignedIn() ? (
                <button className="button" onClick={this.handleSignOut}>
                <strong>Sign Out</strong>
                </button>
            ) : (
                <button className="button" onClick={this.handleSignIn}>
                <strong>Sign In</strong>
                </button>
            )}
            </div>



          </li>
        </ul>
        <div style={{ paddingTop: `70px` }}>{this.renderDemoType()}</div>
      </div>
    );
  }
}

export default App;
