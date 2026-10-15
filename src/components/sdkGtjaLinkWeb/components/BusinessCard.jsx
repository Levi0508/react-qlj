import React from 'react';
import { Row, Col, Popover, message, Modal, Tooltip, Radio } from 'antd';

import _ from "lodash";

import linkRequest from '../utils/linkRequest';
import utils from '../utils/utils';
import Base64 from '../utils/base64';

class BusinessCard extends React.Component {

    static defaultProps = {
        emp_no: "", // 员工工号
        hidden: true, // 是否隐藏
        trigger: "hover", // 展现方式 hover/focus/click
        url: "/api/eoagw/eoa/frameAjaxMappingHandler",
        urlType: "THRIFT_EMP_Q0004"
    }

    constructor(props) {
        super(props);

        this.state = {
            count: 1,
            userinfo: null,
            __IP_TEL_USED_MAC: null, // 当前用户的默认ip电话地址
            IpTelList: [],   // 当前用户的ip电话列表
        };
    }

    // 变更员工号
    componentWillReceiveProps(nextProps) {
        if (nextProps.emp_no !== this.props.emp_no) {
            this.setState({ userinfo: null });
        }
    }

    componentDidMount() {
        const { children } = this.props;

        if(!children)
            this._getUserInfo(true);

        //2021-03-08 检查当前登录员工是有IP电话
        Promise.all([this._getUserIpTelephone()]).then((res) => {
            if(res && res.length){ this.setState({ IpTelList: res[0].ipTelList }) }
        });
    }

    _getUserInfo = (visible) => {
        const {
            emp_no: destineuserid
        } = this.props;
        const {
            userinfo
        } = this.state;

        if(!destineuserid || !visible) return;

        if(userinfo !== null) return;

        return linkRequest(
            'SYS_USER_Q0004',
            { destineuserid },
            '/api/eoagw/eoa/frameAjaxMappingHandler',
        ).then((data) => {
            if (data.State === 0) {
                let userArr = data.Data;
                if (_.isArray(userArr) && userArr.length > 0) {
                    this.setState({
                        userinfo: {
                            id: _.get(userArr[0], "USERID"),
                            name: _.get(userArr[0], "USERNAME"),
                            mobile: _.get(userArr[0], "MOBILE"),
                            email: _.get(userArr[0], "EMAIL"),
                            tel: _.get(userArr[0], "EXTENSION"),
                            dept: _.get(userArr[0], "DEPTCNAME"),
                            job: _.get(userArr[0], "JOBCNAME")
                        }
                    });
                }
            } else {
            }
        }).catch(e => { });
    }

    // 展示ip电话拨号
    _renderTel = (tel) => {
        const {
            IpTelList
        } = this.state;

        if(IpTelList && IpTelList.length > 0)
            return <Tooltip placement='top'
                        title='点击电话座机图标，您名下的IP电话会自动拨打该号码'
                        arrowPointAtCenter>
                    { tel && !_.isEmpty(_.trim(tel)) &&
                        <span>
                            <img src='/image/header/work_phone.png'
                                style={{width: 20, height: 20, cursor:'pointer'}}
                                onClick={(e)=> this._dialing(tel)} />
                        </span>}
                </Tooltip>;
        else
            return null;
    }

    _renderPannel = (hidden) => {
        const { userinfo } = this.state;
        if(!userinfo) return null;
        return <div style={{ width: "350px", backgroundColor: "white", color: "#171717", display: !!hidden ? "none" : "" }}>
            <Row>
                <Col span={24} style={{ height: "38px", width: "200px" }}>
                    <span style={{ display: "block", height: "38px", background: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAA8CAYAAAAXB2OkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4JpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpDRUE1Mjc3RTEzMjExMUVBOEYyRkJEMkJDQzBDQTc4MyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBN0E0QTM3QTE4OTUxMUVBQUE2NkU5MzEyOEE5QzRDNyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBN0E0QTM3OTE4OTUxMUVBQUE2NkU5MzEyOEE5QzRDNyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmVlN2Q4NWQwLTkzYzctNGQ1ZS04NDE3LWVjNjE4ODUxODdkNiIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjE4M2U3Mzk3LTI1NGMtZmI0NC1iNmJlLTM5YjllOGZkODRhNSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkYm8WwAABrlSURBVHja7F0JfBTF0u+EhBxAiNzEcEVF5AoJwQNFEFE5ZMETxeP5OJT1QhQVfCALKqKf4NOHrog8ERVPDldRBLnkNktCALnvI5yBhEAOcn1VPTVJZzI7O5vdhSyv/79f7THT09M90/PvqurqnqCSkhImISEh8b+IYHkJJCQkJAFKSEhISAKUkJCQkAQoISEhIQlQQkJCQhKghISEhCRACQkJCUmAEhISEpIAJSQkJCQBSkhISEgClJCQkJAEKCEhISEJUEJCQqIqIcSXmQUFBXmXgcVeAz6bkDQFiRW/Ifsrw5I6HcgrYtHw/zDIAZBD9Ptg6bct6bi8tRL+QJ9ePUPhK2zBbwvPyavhI1jsSBzVmMNaaJTMHytXhVziiveAzyEg1xHJ1XGVtHpI8LGFtj6Z07Jqhi1KPnzqzNm8G2HzjbqJbc4LRIb7QRaDfAikmOPHekTgQ+HjXIugQWR7Wa7b4LM2/VsG+WVdJg/MDfDZmP7tgXptvpgcCPICSLeLcjabsyZ83kHt6w9ox6cuM/LD+7gOJBp+94R7uTZgNUAPKl0XPt8HecxM8lax0ZtWTep/bd1a4WEz1mbvua1Tkw47D5z5e8vuU3GwO0KPL0HiSLqDPAkNaQg0nqV+qtHbIMP9cJ3eggYxxsW+/iZy+AykLv1+Bo5JN0h7FM613qAsUfC5yQe1OgrSD851wos8RvM8FHxAhHT5websCZ9fC4rBOdg2gdfZlnTBX6e9d2VWDBLu3C61912EWt5CVh6iF8hlToAW+wPwORWkgYnUF0bdl7Bt4mM3xGut65bNrmjTsG7kyRXOw8cKi4pbuMkH9y+BxoOE8DI0nkw/1hBNcm+ItgNIPP2+G2SMi3TzPMz3Izf7fwIxIlW0P/SuWzWQtsL/NBfHXwsSDtIMpDPIfBcukK9N1OUG4XdfOK65m/R/8U7KYQ2c1X9tTgt8/ggSKmxFbfBdkMGwfzi049/9QH4d4WsNcgP87gUkuKiS5e9D5f0eyml03dFCW04k/xUdi3VuB9KRnod8kPEgPrdgLh4BWuyN4NPu5iErRUT1kCNL3ugbdFOrhvGu0tSuGVa/z61xdVdvPJJy6kxuools0dzuDRfYCjfF4aeapsCD9oQX18kmEKARRrjZ31W41mgi/tdN+j2GexVzvINOedEfe4b+5UG6Di7qtdFEvUIFzc4sVE3fCP2IcLcGCPkNgM8vBfJDd85ZkNZCZ7IQ0mGdXoS27EtN7V9kQSESQBbplC+UE5YrX7vNeRd8/kL/IkE+d3m2xE5IbqPoXC+zRGdH6lBDNSmPgEwOPAJUHJxPkMlb28whCXH1Nq6Y2K9trYhQt+WrFhwUfGtibOLew1nbNu440YR6HSPEcG3H5vwWvp+Hm3jSD3XuLqj1nuC0B2m/IvPBFe4Xfm9jij/UCAsrWVtRk8/w8ZXsQg+/ntZZZOL4fRq3SCCQ3yPwOYuVRWhgx9QN5Bh3YzCGJnAU7cMOriccg1rhJGjLuV5qf3FCp4la2w+QdwR1XEhQiaSVtePcYXOiNfWeTlbXCb+baYjzesojkaQ13U93OBh4JrBimnzKFCeuW4CZm//WozfsGn1/QgdPTxUXW/u6BnUiM5clH9xdUFh8tYlDHgLpQabEbB/X/PlKaDKq+TjfZNq2HpjBD5IY4QoXJi7eRyPyFImloUHaGOH3p5Du31yrcVjbG+R9GPbv1ynPDPhswxTfq8OlaWuxs4CCzTkUPj8RyG8LyO3QPlV/6QeQ5htOdopSEURuhdf5f5sTtcE5XpRgBOWJmD93ya4J9Jy4Iij0Ub5nsm7INU6Q9ibLshsklVtUjP0J9VrDxgXKKLDFjjfwWZCJIDXMHFIjPGT/6kn31IhvUbdtZU9bMzI0uk+XuOh1m4+mHDt13oxJXI/7nGzOh+F7GFzkIz66AvhgztTRlKYJ/1/UaCiMfBxdTZ5jO8g/Xex7DeQa+v0r78ndw2iU3Mhn2lSjAbpK21Awa85TXbMr0baehM9B6kMKMhbkTRboQLcMYx8LWzYT+ZW3UBQyHATpsS39B6STcB9+hO1/MByQsyVtdaPtqZpdkqCVlWpuxzNyvmaKD9Ko/f2fBzWs74L8kNV2gmwg2ditU5OcOlHhqO0untul9ix/XvYQP5BfK/jEHrqz2UNubdM49bdxfeIjw0K8DswODg5ineNjEg8ey965YeuxhiUlpszuu7l/yOYcyXDk1Nhp6x56o6kVHfUYlrJRJ11XE9d4kGAGaRElkJ9qQkWbKPXTkG8qlGmFTn06GJRlE2mPCCuknWfCBzgC0s3XOU+moIHo5YFhT1OFLaghTTG4D0EBQn4vM2VwQwUO2twJ7dC109+WtB6Ou5E6g4lEMIxbNWhJKNrgfzSk9yBZYx2JjFxpdktXbzyC93E5Pp5EUClEUIpWZlQ2/fIehTK9gVojWHrbmzWOOpmTV7jkxOkc1O7KxVTWWZmVTMT8CJR5AZBgRmAQoMU+lHolszFxxR8MvXn783e3S/B1xZo2qtWyXnT42SXrD+4Dk7iFiUOiyFx/CG5UP+1NqWJ4vZxvxRjPeZAvhpSs8OB+dyd/kKq9/u5l+0GN3JUPtxbIHEGLLCAtuoFJUxcHaI5VQfIbRRaDinWKX88EwdiSipUO24nXZTzvxBRSw+d6JJAHhhzZeWfL2Bcg37nJEQORf+IdmeLa+JQpfnJv4izjoXwYgdCBtNrO93S/Ziy14UdBWs21lSPptkR+qqXg1+fQ1xqgJ+THrm5cezOQX7y/KhcZHhrV4doG6cl/e9Tuu5Pf4zMvH+aV9NDq+coYb4wWe65pTas80AyM1DExcaBJjYtco2OiIFlNoN84qviMpoHtMagPPqijNFvFGEwkrnQDMqplol7oT/qHyWuAROhJiAYSe7cqRn5vkbuizCpAa8Rk0D6QBZq9iXQtRs5dsms6dWIYAD+b2gl2Khh69psL0zOZvluC/Aza1vdUtqnUPnLhdxMoU4abuiDx9iPL7x5hjxj1gftmCaZwA7rf/xbSPC78/hM1XKjn1eTGWVfVCdCj2RBX1Ay74O82FhoaHFoZd6IvlFBWftRba97joEBRpXJ2WBdpyOkGakQRApHdx5TgbHXbBG52WuytieCjyHyywHYzvSyap/uF/22E9oM99W4PauBKu0lxYa6jWSf6kpM52Va8Z7cL//Gh3qYxl6sS+eFAxqvClsWcLFyQH43QdmRlsXEdidxUvAnHjuUduM0ZDr/z2O1ZA5kyW2o5EU8Rmcrc3wZkl015/8aUAY2B8HsVbMdr21bo5DC6IkNT/jqk8FwgKwPrMsZNrdGfuQtkrkCMg+Gc06lO6M98VkjfmwSB/u46Vd8HKKGSVDMdH6A46NFF1wfouck4mohO9eekcS0CzT2L3SqQMBIkhtkMZso0sq6kKayFdAMg/VY39cHRyU8orOkdVj6mbzDs/84H1+xDhtMWy9fxMVZ+RH01f8gd1guadJ8KBIgP+r2Q5u8q6vN7TUN+PzMMW7IlXQAyCCZtrINAeInMfQhZLcE0zsMvILLZpAmqmKVDrBGsLEoDr1spAYdUC2a1a4Wx+Jb1H45emTWcSBHbyWDQNlFTGyho11e6KNcOpsQ04gjwKijbeSDmLdwloYxgtyVrxJ3//7Q/boUkwECDxR5K5PUoaXJh5fxcSjyfUWwjEuBfZI6EUgPcCPlioDROvTtkcG40s7G37qsxLY/DPk/My3Q4z04TdUVTaZpm68cVNGeLfRx8DhW2TK2y5Kegl/B7bt+uV30aGhL8LhADEl2CBxbIWdLmcPrYu15wQDWh/QwFUuyQk1fYKTK8lB5eEdInkW8whXyGRdTpYrvLpjI1pnaG+Pbe26+ZyC0N7PRvz0IrYj0rH+isR37i6LDThP9SEmAAkhkGMqsR8wvgoX3ExFGo8Y3XMS2w8cWRZoGN8l8653tE0LCwR0V/zzBqjE9xsdh/g3L01tFeh5F5og1r6kq+K09QCHm2MSRBix0fys9ZxbneGJ4xBfb/QA/F4xry26jjq6xqmEiEtRTIbzqQn5lBBlwEQY2LU0NG9oGW51XEAprBQHhppNHXUolUID8tMDB9O/cJ2pzNeFsrmxEynDRc7dzsRwXtcySrOMujiNwVqUR2PBwGyna+PCWWSAIMEGLD3q+dZqs2bGUYmQCqadMRjhtmIncczbMxJVwEo+PtTAmebc/KRnBfhby04Sj1NeblaCAgDEhGfwyO0qmhM+s1dcGR1sk6mkek0H5w8MJMDCWO/F1Bx8VQD+/KHC6iDgLJGOM0+9D1QjQkMn5Wc9Qerp06rHlVun3YktDnxgclQldmtdNJcVwluXM5BXs3bD12VUZW3gI4zrNBAJszltpKJ7pfa3nHaEvSavnPkA8yQss32efzWfXQar+Eh4UsFnyHeVSPdJMlEQfs9hEJtszNL9yxbtPRuHM5F1YVjEn81kUdsExXMSXusFASYGCgL3M/E+Qpzf9riRTnu/GTHQBiGEOawCL4X0xLCr2t6VFDdO61aDoOh+OWwPGLaWDkQSIa7aIJi4XfxaR1vUaaVu1SrcyMP9Nif4GVxQya8QniKPkcLhZ7LdJuXzVot2GcFC32b732r14kAJlsBg3sXviJ8bMYU5lKgxAqAWAwMg5ovQS/G7sNj7E5kVBx1PdbulbiqCqOpuIgSXvI57RQhtVo9jJlRBbv6ZZVqUeezMjMTSgq5lrXWEhf2es58NdV+wb0vqUFzo7C+zmvVGu1OdGdYeUEbHMiweEAieL7LCy8jZUUd6H2Esz8NIovCdA/GEE9r6fIJRJyRwwTS81EJfYSyU9d9qqAPwAO6zpNSArGhOFo6hKmjB625iRqsb/BNUOHVeswV8+1GdKgKXqIm6Tq1DR/TjOz2JHIYsmkx9Fm9I3dzNwvehBbSpIWOzrfv+GE7bBur+IkaDSlUZ3WGUFkkAVkEUzb1bm5HYn80QRF10BzIkG9GUA4WPG8tn1CGXaWc5vYnA+ZvFd1eNtzWHe5SHFNXn7hKMh/gIaoscMfImzBa9CMqYHwIRWo6SbpAwwMoH/jDCtbIcVThJtseOjPe5Mau4oTXJPTm82hkNkmOO5m0jKvI7McYwVfge3TYP9YF8cNclOaGDg+0yftzWLHoPW9JvJCTWgGaTo4W2EgEYKoUdu4WOwfQR2eDdD2JM5mGQPEgSPErgZKcEaJGtKEo7noK15Jv1HD/MwrMrHY67PyYTgoLWjfK3CN1bjTLpojU6DcuK0zlb2jQOwqmhucGTuzdyQBBgZ6e0F+nqCGptGgafocNMKTwoIEURqzmPGBB4sdR/ImkCYQSv7BGC/KssBntXJY90H5cEbJXTp78RUIOOAyl8z/fNqOcYGT4Tj0FQ0gLVqcU74sIFqOsloKdkxJRBIJmnoMNjgazcqFZH1gTN+vYLYWlbowbM7zGleBMUpKQpm6COeuHXht0UfcxOCI23hnanNifJ8YCL2NSPlPE1cAy7uVnc2KAmnGcqDIeXkfs7lDn+F7x8lBkKoKDCv5wg/5Gi0B9DWZe9jAUXtLNTgeNcLDAsmgRjASGvWHRIJoLk3xsGxoLkd6UTej6Tnv0P7jVAfUCNOg3OluyBMHQSZyUeakP0wPpqPKthycdqmExajzc80u26UOlKgjw+uEQYn/elQGZa1OVaNL4hre+XNNWE0KLSws7G5wdB6VYRzNTZ6t0VrnkjbuCuiLfJ3qksZSknGAa49A6lP8efl9TYD5zIPZIBnZeX5fo62goLigEod5Nv/Qlf/Mn3BYsUe/ysW+5ibzOMiUEbmRlTj/036s2zKvtTbF7zeOpKqS303M/PJnCJzquJQTjrcrFynxpHYiX7Pafx5TYv7UMBwn19jwZUY251VMmaqmDVsqZGWrQhXQ8Wh9qLNYniu3HJ3Fjq4KNS7wZ+rUAoYAUVX9yCwJ7j12tt37jk1bR1jat/ZH5c7nFpxN3X4i3MPDFpFfSULC39BbrWYfaXSpRDIYYtSG9uHLvfZ7QHJRvDPHSIGKuMONSV1cSkSRkTaWmzOvlOwqEnk9Mr/rCQpEmY/SlnSs9Fw25wNCOtz+vSa3HsLvD/x9A3xLgA7rDFoEAJ3Tt5g4IvjFGWta/7B6T+ri8X3ja4SH+Ow9xQeOnt2Zsu14o5IS1tzkIehUf4mbD94uhyUhYUoDTFoDhIAhMHGkGaWI4SlEGOac/xY7zj1PEExZlIacSC3263WOQA0Zg+fRzj0vaHZKIHLNWhiicitP2azFT+zzB4xeiIWDZ+qgBkYy4EyRF12kbSz8bsQJ3+bEqYC/cO02JRmnzbVlykK3S/19C3zvA1Sc7Dg7AON7JjET03rWbj+e0ODxmQdXTeofnhBXr4E3py8uLmFrN6WnHM/ISfTgMFwC6GkPAjtdNUJU//tQ48N64GAILhLwI1yXU5QGfVMPcS1TDM9Q3q2BcXLLYftyYXtDSt+KemQMR/kd0iQLDb+7m5L9VTrXV3nx0J266/YpD0pr2DfTgzp3Y0p81iQegGyx4wghOsJnllvNWfEzDeOaAoboKNswFvJL8kmKeT5BbWmmzvli+cMmXiNlO2r6g7hZp10hWlnJZiNsX1gFSXCegYkcwcqH/mQJ9zxJQ3b1XOSSoCEd9TndSyPudZjyatHyWmKi0xMlIEvQGge4dM2UWVhoCquzQWKJK1ByWGKnxaykZBgLCvrlYnhug/2SK15Mh/UjUt1NrRGXk1/YtOOLP0ZP+G5Dpdceyz5/4fSClXv3ekB+pzi52JL6+4D8cNRyL/k70BeKmjBOUcNwlZuFlK3IL9VKk0M0be8m5NmXKQ7hntRDI+lh418D+2bRdLF6dIwqU0jEbbGa3vorOFbP74OhJJ97WPNuVG7V1dCB/ms170a0XXyX82jePix27UT/J0hc+cG+pM5GRDi5X2aSf0vEKLqGAaQd8lg/UYHYAtpRJtQNSRxHwzFAHAPS7zIgPzRFp7qc3+2wZvD4PX0T+bQOwYnli+Lr/Cmv6ZxIbed6eI5+dkP42OljSMxsVjFaAgfV+gH54XzzdMj7L5Cx5F8MEA2w/AU+yBue0qNPZm6WswFztfq42cntfly9J23lpP6ta0dWN72U1Z5DmVvTdp5sztwHy6rAG/C823XOzJFfK9IilzPlnbf5wt53KplnI/JFQk9oFYNIP4N9y6j862Dfx+XIQll5mem+mU4pJ5omWOc3WdnS8pcSqL2s4h2Iu1Feix39VveQ6fYS018KX/Ex4etXtZpl1SY8dYl6Nc7uNo0mhf6wGKYfHoRQF0ZQJYVbH/rkZgav0nXew7VNm/MpKl8aEe+zTFmAlZHp/o0HWu96rhgoawiiqwxXZMfO/lqNf7QTyWgKnD4UWARYRoQzqefCRRbvc5d884HT8Y3+8UX64vF9S25p3ehKo7SFRcXFqzemp+G0HZOlwdGzp+AmLPBhDXGyNw78jNSQnzfoRT2iXnjNd0wJakVz+2MP8sT12zAkZjonV4v9Ayhv2iV+9HG2QiaRIJrmu12QX3Uq/wymDBT8C7ZNh/TaVzMiKWLALU7xw2XBzlRh0sMO/m3STrFzcrVE/RxebzTtlRdC9WHK+obi4gi7vXrvsaJxtmRl8YfqLBPtHHYsK4a2qPO4i1jFd9uIazoWGhBhEbXHFVCvX1ijmCgWcyX6Ei1EjCo/RZA/M0AJUCFBHPG5Hyp6H5kqDY2S510oiukyen7BCEv7tMmDOld4MToiMzv/xJ8bDucCCZolP3TO4qv8zvq4duKolvjQZhIxonnWQvcNZ66hxtid13UxWOx5zJMFaJUX0vcg3xE+ONtJK+9xiWmgBOqD85LRzFpLrgQ9oOaKU6VspJngEk3jya9YzpvCcC1AZQ26PyG/XlVY7+tLmiwzMGHRnfFG6cCcwzqkkufKLOeGUWL2WlJ7SCTtzswyXBncBLcloXmayO+FLWm3QKRtyJ/HSk13923zUX6/jqWXgHSCOr4P+USTEoDtcwecw3l5BEI7rHPIhMMb627589D3HZvif04+sGXNO/2vqV87ovSB377v9JatezMwOt3MoAmq8UPhIvprRsB6pixu0I80FLWu0bQAwPtCWjUusbqLe6GaLH/R9x1M+54Oi70duRNSTZJfDbreOF+zHUka939a7L2hnL96UXe1t88XNAJ+7zTpqhtqBA7r61AW7JiWEunvEsrfhHyXGwQTEMs/BPahj2uLJq8LsH0gdXirmNnphRcfu1jZgEAxU6Z8qeEvTt4GaHFTHwD9huiSakrKx1qTx50SzGp0ryyDMp0iDS5VID7M08GUN8ypwPOZaVuxgtnbmPJGwv6GxG+4NDNBHNbT3G+lTLLHHq0tXQRdZ+7uo1ltr/znlyccY3rlFhTWKlqSfDgtKzvf6F0i+aQu46AEDsJ8YvY9C5UEahuPcRNNGc2dRVPScPK69lWAaVQ+1Ho2Q7pt5O9TJ6KvpWuUDNtnc43VYt9DPr9CMg2mkyk/2ayBQw0LnerNadsOkvcg/0W68V36ZIpElEukjiEUGMy7jVZuYfSgFHPNBsutjDY2IZ9SMTN6r4PDimXJJrNenFw/hYjiD6H8K4jIcf263jp54XJaQ6icw6umCZy0meb2NuSaEq6W7L9zldA6fXOY6zfvpRPJqQScqrN0livcpyG/XO4asiWZee3FVGpL6K5YcDFvwaWdCqdM2l8hPFzhZObEkjRVvwuKipv2nrAgJqxj0qG84qBo6tkPUy9zkH4f4qJ9l6r/61FIphYGguOo70R6N3IeU+ZC4stvTlDaw7CvJxEe+j5wFZcsIqMBfHmqMjxOGgHO1JhGDfcI9aoTTL3lTFnq6gWmhJuM0ezbQj64IUxZU9CstjuZ6oTlSSbyV6/FVu57U+qXTJ3AaTKF0CfnFPI6y7TvI3ZYp8Ex50qtA2Xg436GCwE4rG9pyp/HfWgWew8qR5agiTLyib1AmmVUFSVBdIvsv0jnmgckeCe1hxg6b1nQtRKwXFlgeMtJsgiwoxoF+W0y+fycY3oL+F4UB0xJic9EQuJyR59ePfuDLJdXQo9gndVA/Da91ZdcpUqQJC4JCYn/VQTLSyAhISEJUEJCQkISoISEhIQkQAkJCQlJgBISEhKSACUkJCQkAUpISEhIApSQkJCQBCghISEhCVBCQkJCEqCEhISEJEAJCQmJKon/F2AA7Q4NVgL2Oo8AAAAASUVORK5CYII=) center center no-repeat", backgroundSize: "100%" }}></span>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "20px" }}>{userinfo.name}</span>
                    <span style={{ fontSize: "12px", lineHeight: "30px", paddingRight: "12px" }}>({userinfo.id})</span>
                    <span style={{ backgroundColor: "#007FBA", position: "relative", top: "8px", width: "8px", height: "16px" }}></span>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ display: "flex", opacity: "0.6", justifyContent: "flex-end", paddingRight: "20px" }}>
                    <span style={{ fontSize: "13px" }}>{userinfo.dept}</span>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ display: "flex", opacity: "0.6", justifyContent: "flex-end", paddingRight: "20px" }}>
                    <span style={{ fontSize: "13px" }}>{userinfo.job}</span>
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ paddingLeft: "20px", opacity: "0.8" }}>
                    <span style={{ fontSize: "12px" }}>{userinfo.tel}</span>
                    {this._renderTel(userinfo.tel)}
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ paddingLeft: "20px", opacity: "0.8", fontSize: "12px" }}>
                    {!_.isNull(userinfo.email) ??
                        <span style={{ marginRight: "20px" }}>{userinfo.email}</span>
                    }
                    <span>{userinfo.mobile}</span>
                    {this._renderTel(userinfo.mobile)}
                </Col>
            </Row>
        </div>;
    }

    render() {
        const { children, trigger } = this.props;

        if (children) {
            return (
                <Popover
                    trigger={trigger || "hover"}
                    content={this._renderPannel(false)}
                    onVisibleChange={this._getUserInfo}>
                    {children}
                </Popover>
            );
        } else {
            return this._renderPannel(this.props.hidden);
        }
    }

    // 点击拨号
    _dialing = (tel) => {
        const {
            IpTelList
        } = this.state;

        if(IpTelList.length == 1) {
            this.state.__IP_TEL_USED_MAC = IpTelList[0].MAC;
            Modal.confirm({ title: `你确认要通过名下的IP电话拨打${tel}？`,
                            onOk : () => {
                                this._dialingRequest(tel)
                            },
                            okText:"确认", cancelText: "取消"
                        });
        } else {
            Modal.confirm({ title: <><span style={{fontSize: '14px'}}>您名下共有{IpTelList.length}个IP电话设备，请选择一个拨号设备标签，</span><span style={{fontSize: '14px',color:'red'}}>同时确认要拨打电话{tel}？</span></>,
                            content: this._getIpTagRender(),
                            onOk : () => {
                                this._dialingRequest(tel)
                            },
                            okText:"确认", cancelText: "取消"
                        });
        }
    }

    // 发送拨号请求
    _dialingRequest = (tel) => {
        const {
            __IP_TEL_USED_MAC,
            userinfo,
        } = this.state;
        return linkRequest(
            'dial',
            { destination: tel, destUserId: userinfo.id, mac: __IP_TEL_USED_MAC },
            '/link/common/ipphone/dial',
        ).then((data) => {
            if (data.State === 0) {
                message.success('拨号成功，请使用您的IP电话设备。');
            } else {
                message.error(data.ErrMsg);
            }
        }).catch(err => {
            message.error("拨号失败，请检查您的IP电话设备、所拨打得电话号码是否正确！");
        });
    }

    // 获取ip电话地址列表
    _getUserIpTelephone = () => {
        return new Promise((resolve,reject) => {
            const localStorageeKey = utils.getCookie("oem.sessionid") + '_iptellist';
            try{
                if (localStorage) {
                    let result = localStorage.getItem(localStorageeKey);
                    if (result) {
                        result = JSON.parse(Base64.decode(result))
                        resolve(result)
                    } else {
                        this._getUserIpTelephoneRemote(localStorageeKey, resolve, reject)
                    }
                } else {
                    this._getUserIpTelephoneRemote(localStorageeKey, resolve, reject)
                }
            } catch(e) {
                this._getUserIpTelephoneRemote(localStorageeKey, resolve, reject)
            }
        });
    }

    _getUserIpTelephoneRemote = (localStorageeKey, resolve, reject) => {
        linkRequest(
            'SYS_USER_Q0045',
            {},
            '/link/common/apiajax/ajaxMappingHandler',
        ).then((res) => {
            let ipListResult = res && res.Data && res.Data.length ? res.Data : [];
            localStorage.setItem(localStorageeKey, Base64.encode(JSON.stringify({ipTelList: ipListResult})))
            resolve({ipTelList: ipListResult})
        }).catch(err => {
            resolve({ ipTelList: [] })
        });
    }

    _getIpTagRender = () => {
        let {
            IpTelList,
        } = this.state;

        let radioOptions = [], defaultSelectedValue = IpTelList[0].MAC;

        IpTelList.map((ipTelItem, ipTelIndex)=>{
            radioOptions.push({ label: ipTelItem.REMARK || ipTelItem.MAC, value: ipTelItem.MAC })
            if(ipTelItem.IS_DEFAULT){
                defaultSelectedValue = ipTelItem.MAC
            }
        })

        this.state.__IP_TEL_USED_MAC = defaultSelectedValue;
        return (
            <>
                <div style={{ width: '100%', textAlign:'right' }}><a href="/ehr/emppersonalinfo.html?editflag=1" target="_blank"><img src='/image/header/work_phone_edit.png' style={{ width: 20 }}/>前往修改标签</a></div>
                <Radio.Group options={radioOptions}
                    onChange={(e)=>{
                        this.state.__IP_TEL_USED_MAC = e.target.value;
                        //切换默认选中的IP电话
                        IpTelList.map((ipTelItem, ipTelIndex)=>{
                            ipTelItem.IS_DEFAULT = ipTelItem.MAC === this.state.__IP_TEL_USED_MAC ? 1 : 0
                        })
                        //
                        const localStorageeKey = cookie.load('oem.sessionid') + '_iptellist';
                        this.setState({IpTelList}, () => {
                            localStorage.setItem(localStorageeKey, Base64.encode(JSON.stringify({ipTelList: IpTelList})))
                        });
                    }}
                    defaultValue={defaultSelectedValue} />
            </>
        )
    }
}

export default BusinessCard;
