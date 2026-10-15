/* eslint-disable react/jsx-first-prop-new-line */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable prefer-destructuring */
/* eslint-disable radix */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-const */
/* eslint-disable consistent-return */
/* eslint-disable prefer-template */
import React from 'react';
import { Modal } from 'antd';

class Com extends React.Component {

  static defaultProps = {
    draggable: true,
    autoIndex: false,
  }

  static confirm(config) {
    Modal.confirm(config);
  }

  constructor() {
    super();
    this.simpleClass = Math.random().toString(36).substring(2);
    this.init = false;

  }

  startX = 0;

  startY = 0;

  move = event => {
    const { movementY, movementX } = event;
    let { top, left } = this.contain.style;
    if (top === undefined || left === undefined) {
      const bounding = this.contain.getBoundingClientRect();
      top = bounding.top;
      left = bounding.left;
    } else {
      if (typeof top === 'string') top = Number(top.replace('px', ''));
      if (typeof left === 'string') left = Number(left.replace('px', ''));
    }
    this.contain.style.top = (top + movementY) + 'px';
    this.contain.style.left = (left + movementX) + "px";
  }

  removeMove = () => {
    window.removeEventListener("mousemove", this.move, false);
  }

  removeUp = () => {
    document.body.onselectstart = () => true;
    this.removeMove();
  }

  toTop = () => {
    let autoIndexArr = document.getElementsByClassName("autoIndex");
    if (autoIndexArr.length < 1) return false;
    let max = 0;
    for (let i = 0; i < autoIndexArr.length; i++) {
      let zIndex = parseInt(autoIndexArr[i].style.zIndex || 1000);
      if (zIndex > max) max = zIndex;
    }
    this.contain.style.zIndex = max + 1;
  }

  create = (visible) => {
    if (this.init) return false;
    const { title, draggable, autoIndex, style = {} } = this.props;
    if (title && draggable && visible) {
      this.init = true;
      setTimeout(() => {
        this.contain = document.getElementsByClassName(this.simpleClass)[0];
        if (!autoIndex) {
          this.contain = this.contain.getElementsByClassName("ant-modal")[0];
          this.contain.style.paddingBottom = 0;
          this.contain.style.display = "inline-block";
        } else {
          this.contain.style.right = "auto";
          this.contain.style.overflow = "visible";
          this.contain.style.bottom = "auto";
          this.contain.style.left = typeof (style.left) === "number" ? style.left + "px" : style.left;
          this.contain.style.top = typeof (style.top) === "number" ? style.top + "px" : style.top;
          this.contain.addEventListener("mousedown", this.toTop, false);
          this.toTop();
        }
        this.header = this.contain.getElementsByClassName("ant-modal-header")[0];
        this.header.style.cursor = "all-scroll";
        this.header.onmousedown = () => {
          document.body.onselectstart = () => false;
          window.addEventListener("mousemove", this.move, false);
        };
      }, 0);
    }

  }

  componentDidMount() {
    this.create(this.props.visible);
    window.addEventListener("mouseup", this.removeUp, false);
  }

  componentWillReceiveProps({ visible }) {
    if (visible !== this.props.visible) {
      if (visible) {
        this.create(visible);
        this.contain && this.toTop();
      }
      if (visible && this.contain) {
        this.init = false;
        if (this.contain.style) {
          // 打开弹窗时复原位置
          this.contain.style.top = null;
          this.contain.style.left = null;
        }
        this.contain.removeEventListener("mousedown", this.toTop, false);
        window.removeEventListener('mousemove', this.move, false);
      }
    }
  }

  componentWillUnmount() {
    this.removeMove();
    window.removeEventListener("mouseup", this.removeUp, false);
  }

  render() {
    const { children, wrapClassName = "", draggable, mask, centered, autoIndex, style, ...other } = this.props;
    return (
      <Modal {...other}
        wrapClassName={`${wrapClassName} ${this.simpleClass} ${autoIndex && "autoIndex" || ""}`}
        mask={autoIndex ? false : mask}
        centered={centered || true}
      // style={autoIndex && {
      //   // top: 0,
      //   // left: 0,
      //   width: "auto",
      //   height: "auto",
      //   paddingBottom: 0,
      //   display: "inline-block"
      // } || style}
      >
        {children}
      </Modal>
    );
  }
}
export default Com;
