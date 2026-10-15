import React, { useEffect, useState } from 'react'
import {Divider} from 'antd'
import styles from './style.less'

const WrapContent = props => {
    // style={_self.length - index === 1 ? 'display:none':'display:block'}
    const dataSource = props.dataSource
    const cutLineStyle = {
        borderBottom: '1px dashed #EBEBEB'
    }
    const contentItem = dataSource.map((item, index, _self) => {
        return (
            <li key={index} className={styles.itemStyle}>
                <h4 className={styles.title} >
                    <img src={item.titleIcon}className={styles.titleIcon}></img>{item.title}
                </h4>
                <p style={{whiteSpace: 'pre-line'}}>{item.content}</p>
                {
                    _self.length - index !== 1?<Divider dashed/>:<p></p>
                }
            </li>
        )
    })
    useEffect(() => {
    })
    return (<div><ul style={{padding:0}}>{contentItem}</ul></div>)
}

export default WrapContent
