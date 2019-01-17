import React, { Component } from 'react';
import { Content, Button } from '../GlobalStyle';
import styled from 'styled-components';
const moment = require('moment');

const Table = styled.table`
  width: 100%;
  border: 1px solid black;
`;

const Voter = styled.div`
  width: 100%;
`;

const TableColumn = styled.tc;

class Vote extends Component {
  state = {
    electionId: null,
    electionName: null,
    loading: false,
    drizzleState: null,
    candidatesData: [],
    currentTime: null,
    unixEnd: null,
    isWhiteListed: false
  };

  render() {
    const {
      candidatesData,
      electionName,
      unixEnd,
      currentTime,
      isWhiteListed
    } = this.state;
    let countDown = moment.unix(unixEnd - currentTime).format('H:mm:ss');
    return (
      <Voter>
        <h2>{`vote on ${electionName}`}</h2>
        <h3>{`end time: ${moment.unix(unixEnd).calendar()}`}</h3>
        <h3>
          vote{' '}
          {currentTime > unixEnd
            ? 'now closed'
            : `open: ${countDown} remaining`}
        </h3>
        {true ? (
          <div>
            <Table>
              <tr>
                <th>id</th>
                <th>cand</th>
                <th>votes</th>
              </tr>
              {candidatesData.map(candidate => (
                <tr key={candidate['0']}>
                  <th>
                    <div>{candidate['0']}</div>
                  </th>
                  <th>
                    <div>{this.hexTranslate(candidate['1'])}</div>
                  </th>
                  <th>
                    <div>{candidate['2']}</div>
                  </th>
                  {isWhiteListed && currentTime < unixEnd ? (
                    <Button
                      onClick={() => this.voteForCandidate(candidate['0'])}
                    >
                      vote
                    </Button>
                  ) : null}
                </tr>
              ))}
            </Table>
            {isWhiteListed ? null : 'you are not registered to vote'}
          </div>
        ) : (
          //   <div>
          //     {candidatesData.map(candidate => (
          //       <div key={candidate['0']}>
          //         <div>{`id: ${candidate['0']}`}</div>
          //         <div>{this.hexTranslate(candidate['1'])}</div>
          //         <div>{`votes: ${candidate['2']}`}</div>
          //         {isWhiteListed && currentTime < unixEnd ? (
          //           <Button onClick={() => this.voteForCandidate(candidate['0'])}>
          //             vote
          //           </Button>
          //         ) : (
          //           <div>you're not on the list</div>
          //         )}
          //       </div>
          //     ))}
          //   </div>
          'empty'
        )}
      </Voter>
    );
  }

  componentDidMount() {
    console.log('mounted');
    this.setState({ electionId: this.props.match.params.id }, () => {
      this.isWhiteListed();
      this.clock();
      this.getElectionData().then(data => {
        let { expirationTime, electionName } = data;
        let unixEnd = expirationTime;
        this.setState({ electionName, unixEnd });
        this.retrieveCandidates();
      });
    });
  }

  clock = () => {
    setInterval(() => {
      let currentTime = moment(Date.now()).unix();
      this.setState({ currentTime });
    }, 1000);
  };

  isWhiteListed = async () => {
    const user = this.props.parentState.drizzle.web3.eth.accounts.givenProvider
      .selectedAddress;
    const { electionId } = this.state;
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    const whiteList = await methods.getWhiteList(electionId).call();
    whiteList.forEach(account => {
      if (account.toLowerCase() === user.toLowerCase())
        this.setState({ isWhiteListed: true });
    });
  };

  logString = async () => {
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    console.log(await methods.smokeTest().call());
  };

  callNewElection = async () => {
    console.log('uncomment me if you want another election instance');
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    const response = await methods
      .startElection(
        'Test',
        9999,
        ['0x63616e646964617465206f6e65', '0x63616e6469646174652074776f'],
        [
          '0x994DD176fA212730D290465e659a7c7D0549e384',
          '0xe7BA88433E60C53c69b19f503e00851B98891551'
        ]
      )
      .send();
    console.log(response);
  };

  voteForCandidate = async candId => {
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    const { electionId } = this.state;
    const response = await methods.voteForCandidate(candId, electionId).send();
    await this.retrieveCandidates();
  };

  getElectionData = async () => {
    const { electionId } = this.state;
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    const data = await methods.elections(electionId).call();
    return data;
  };

  retrieveCandidates = async () => {
    const { electionId } = this.state;
    const { methods } = this.props.parentState.drizzle.contracts.Vote;
    const candidates = await methods.getElectionCandidates(electionId).call();
    const promiseArray = [];
    for (let i = 0; i < candidates.length; i++) {
      let candidateData = methods.getCandidate(candidates[i]).call();
      promiseArray.push(candidateData);
    }
    const candidatesData = await Promise.all(promiseArray);
    this.setState({ candidatesData });
  };

  stringTranslate = str => {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let hex = Number(str.charCodeAt(i)).toString(16);
      out.push(hex);
    }
    return out.join('');
  };
  hexTranslate(str) {
    let hex = str.toString();
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return out;
  }
}

export default Vote;
