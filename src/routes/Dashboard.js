// Youssef Selkani
// 2019

import {
  Button, Form, Divider,
  Dimmer, Loader, TextArea,
  Message, Modal, Header,
  Input, Label, Icon,
  Image, Grid
} from 'semantic-ui-react';
import React, { Component } from "react";
import fire from "../config/Fire";
import "../App.css";
import { CompactPicker } from 'react-color';
import moment from "moment";
import { CopyToClipboard } from 'react-copy-to-clipboard';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      updateSuccess: false,
      data: [],
      title: '',
      link: '',
    };
  }

  componentDidMount = () => {
    this.setState({ loading: true });
    fire.auth().onAuthStateChanged(user => {
      if (user) {
        const { currentUser } = fire.auth();
        this.setState({
          name: currentUser.displayName,
          bio: currentUser.bio,
          image: currentUser.photoURL,
        })
        fire.database().ref(`/master/${currentUser.displayName}/setup/`)
          .once('value', snapshot => {
            var obj = snapshot.val()
            this.setState({
              bio: obj.bio,
              fullName: obj.fullName,
              username: obj.displayName,
              accent: obj.accent,
              free: obj.free,
              OTP: obj.OTP,
            })
          })
        fire.database().ref(`/master/${currentUser.displayName}/links/`)
          .on('value', snapshot => {
            var obj = snapshot.val()
            var data = []
            var keys = []
            for (let a in obj) {
              data.push(obj[a])
              keys.push(a)
            }
            this.setState({
              data: data, keys: keys,
              loading: false,
            })
          });
      }
      else {
        this.setState({
          loading: false,
          error: true,
        })
      }
    });
  }

  newURL = e => {
    this.setState({ loading: true, updateSuccess: false });
    e.preventDefault();
    const { currentUser } = fire.auth();
    let title = this.state.title;
    let link = this.state.link;
    fire
      .database()
      .ref(`master/${currentUser.displayName}/links/`)
      .push({
        title,
        link,
      })
      .then(() => {
        this.setState({ loading: false, updateSuccess: true });
      });
  };

  editProfile = e => {
    this.setState({ loading: true, updateSuccess: false, dimmed: true });
    e.preventDefault();
    const { currentUser } = fire.auth();
    fire
      .database()
      .ref(`master/${currentUser.displayName}/setup/`)
      .update({
        bio: this.state.bio,
        fullName: this.state.fullName,
        photoURL: this.state.image,
        accent: this.state.accent,
      })
      .then(() => {
        currentUser.updateProfile({
          photoURL: this.state.image,
        })
        this.setState({ loading: false, updateSuccess: true, dimmed: false })
      });
  };

  validateOTP = e => {
    this.setState({ loading: true, OTPError: false });
    const self = this;
      if (self.state.OTP === self.state.userOTP) {
        const { currentUser } = fire.auth();
        var event = moment().format('MMMM Do YYYY, h:mm:ss a');
        fire.database()
          .ref(`master/${currentUser.displayName}/setup/`)
          .update({
            free: false,
            validateOTP: event,
            email: currentUser.email,
          })
        fire.database()
          .ref(`/OTP/`)
          .push({
            id: self.state.userOTP,
            time: event,
            email: currentUser.email,
          })
          .then(() => {
            window.location.reload();
          });
      } else {
        self.setState({ OTPError: true, loading: false });
      }
  };

  // Handlers

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };
  handleChangeComplete = (color) => {
    this.setState({ accent: color.hex });
  };
  logout(context) {
    fire.auth().signOut();
  };
  delete = (index) => {
    const { currentUser } = fire.auth();
    fire.database().ref(`master/${currentUser.displayName}/links/${this.state.keys[index]}`)
      .remove()
  };

  handleCloseSuccess = () => this.setState({ updateSuccess: false });
  handleCloseError = () => this.setState({ OTPError: false });

  render() {
    const listItems = this.state.data.map((item, index) =>
      <div key={index}>
        <Message color='black'>
          <Button onClick={() => this.delete(index)}
            compact circular icon='delete'
            color='grey' />
          {item.title}
        </Message>
        <Divider hidden />
      </div>
    );
    return (
      <div className="dashboard">
        <Divider hidden />

        {this.state.loading ?
          <Dimmer active>
            <Loader>Loading</Loader>
          </Dimmer>
          : null}

        {this.state.error ? (
          <div>
            <Message negative>
              <Message.Header>Error 403</Message.Header>
              <p>Remote Access Not Allowed</p>
            </Message>
            <Divider hidden />
          </div>
        ) : null}

        {!this.state.loading && !this.state.error ?
          <div>

            <Grid>
              <Grid.Row>
                <Grid.Column width={8}>
                  <Image id="profileImage" src={this.state.image} rounded />
                  <h2>@{this.state.name}</h2>
                  {this.state.free ?
                    <div>
                      <Label>Free</Label>
                    </div>
                    : <Label>Premium</Label>
                  }
                </Grid.Column>
              </Grid.Row>
            </Grid>

            <Divider />

            <p style={{ whiteSpace: 'pre-wrap' }}>{this.state.bio}</p>

            <Button  href={'https://monosfer.com/' + this.state.name}
              target='_blank' color='white' inverted compact>
              <p>
                View Profile
             </p>
            </Button>

            {this.state.copied ? <h4 style={{ color: 'green' }}>Copied.</h4> :
              null
            }
            <Divider hidden />

            <Input fluid size='tiny'
              action={
                <CopyToClipboard text={'https://monosfer.com/' + this.state.name}
                  onCopy={() => this.setState({ copied: true })}>
                  <Button>Copy</Button>
                </CopyToClipboard>

              }
              defaultValue={'https://monosfer.com/' + this.state.name}
            />

            <h3>Account</h3>
            <Divider hidden />

            <Form inverted>
              <Input 
                label='Display Name' fluid name="fullName"
                type="text" onChange={this.handleChange} />
                <Divider hidden />
              <Input 
                label='Profile Image URL' 
                fluid type="text" name="image"
                onChange={this.handleChange} />
              <p>Bio</p>
              <TextArea
                name="bio" style={{ minHeight: 100 }}
                onChange={this.handleChange}  />
              <h5>Accent color</h5>
              <p style={{ color: this.state.accent }}>{this.state.accent}</p>
              <div style={{
                backgroundColor: this.state.accent,
                height: '2vh', width: '2vh'
              }} />
              <Divider hidden />
              <CompactPicker id='picker'
                color={this.state.accent}
                onChangeComplete={this.handleChangeComplete}
              />
              <Divider hidden />
              <Button inverted
                onClick={this.editProfile}>
                Save
                </Button>
              <Divider hidden />
            </Form>

            {this.state.free ?
              <div>
                <Label size='tiny'
                  color='black'
                  horizontal>
                  <Icon name='info circle' /> Ad
                </Label>
                <Divider hidden />
                <a href="https://chrysntm.com/" rel="noopener noreferrer" target="_blank" title="Chrysntm Ad">
                  <img style={{ width: '100%' }} src="https://i.imgur.com/P5DTq98.jpg" alt="ad" />
                </a>
                <Divider hidden />
                <p>This is a free account please upgrade to edit your links.</p>
                <h5>Premium Account Lifetime Subscription (Ad-free)</h5>
                <h2>$25</h2>
                <Button
                  href='https://bmc.xyz/l/Bkp9Ifb0P'
                  target='_blank' color='white' inverted compact>
                  Pay Now
                </Button>
                <Divider hidden />
                <h3>Confirm your account</h3>
                <p>Please enter your one-time password</p>
                <Divider hidden />
                <Form inverted>
                  <Input type="text" name="userOTP"
                    onChange={this.handleChange}
                    placeholder="OTP" />
                  <Divider hidden />
                  <Button
                    onClick={this.validateOTP}
                    color='black'>
                    Submit
                  </Button>
                </Form>
                <Divider hidden />
              </div>
            : null}

            {!this.state.free ? <div>
              <h3>Add Link</h3>
              <Divider hidden />
              <Form>
                <Form.Input
                  type="text" onChange={this.handleChange}
                  placeholder="Title" name="title" />
                <Form.Input
                  type="text" onChange={this.handleChange}
                  placeholder="Link" name="link" />
                <Divider hidden />
                <Button onClick={this.newURL} inverted>
                  Submit
                    </Button>
              </Form>
              <Divider hidden />
              {listItems}
            </div>
              : null}
            <Button
              onClick={this.logout}
              href="/" color='red'>
              Log Out
            </Button>
          </div>
          : null}

        <Modal onClose={this.handleCloseSuccess}
          dimmer='blurring' size='mini'
          open={this.state.updateSuccess}
          centered={false}>
          <Header icon='checkmark' color='green' content='Updated successfully!' />
          <Modal.Content>
            <Modal.Description>
              <p>Data has been saved.</p>
            </Modal.Description>
          </Modal.Content>
        </Modal>

        <Modal onClose={this.handleCloseError}
          dimmer='blurring' size='mini'
          open={this.state.OTPError}
          centered={false}>
          <Header icon='close' color='red' content='ERROR' />
          <Modal.Content>
            <Modal.Description>
              <p>Please double-check and try again.</p>
            </Modal.Description>
          </Modal.Content>
        </Modal>

        <Divider hidden />
      </div>
    );
  }
}

export default Dashboard;
