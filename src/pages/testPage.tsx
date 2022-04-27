import { Button } from "antd";
import { history } from "umi";
import React from "react";

const Test: React.FC = () => {
  let state = {
    count: 0,
  };
  const handleClick = () => {
    history.push("/");
  };
  const add = () => {
    console.log(123);
    state.count++;
  };

  return (
    <div>
      <Button type="primary" onClick={handleClick}>
        Test Button
      </Button>
      <Button type="primary" onClick={add}>
        add
      </Button>
      {state.count}
    </div>
  );
};

// export default Test;

class TestPage extends React.Component {
  state = {
    count: 0,
  };
  componentDidMount() {
    console.log(123);
  }
  handleClick = () => {
    history.push("/");
  };
  add = () => {
    this.setState({
      count: this.state.count + 1,
    });
    console.log(123, this.state.count);
  };
  render() {
    return (
      <div>
        <Button type="primary" onClick={this.handleClick}>
          Test Button
        </Button>
        <Button type="primary" onClick={this.add}>
          add
        </Button>
        {this.state.count}
      </div>
    );
  }
}

export default TestPage;
