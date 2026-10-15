import React from 'react'
import { Progress, Icon, Tooltip } from 'antd'
import utils from '../../../../utils/utils';
import './styles.less'
import fileUtils from '../utils';

const FileNameContent = props => {
  const { fileName } = props;
  const downLoadFile = props => {
    const { filePath, fileName } = props;
    fileUtils.download(`/attach${filePath}`, fileName || '未命名文件');
  };
  return (
    <>
      <div className={utils.getClassName('filename_content', props)}>
        <span className={utils.getClassName('filename_text', props)}>
          <i className={utils.getClassName('filename_statusicon', props)}>
            {props.status === 'uploading' ? (
              <Icon type="loading" theme="outlined"/>
            ) : (
                <Icon type="paper-clip" theme="outlined" />
              )}
          </i>
          {/* 11.6 修复文件名过短时，提示居中显示的问题 */}
          <Tooltip placement="topLeft" title={fileName} >
            <span onClick={downLoadFile.bind(this, props)}>{fileName}</span>
          </Tooltip>
          {/* 附件重新上传、取消上传按钮 */}
        </span>
        {props.progressStatus !== 'success' ? (
          <Progress
            key={props.uid}
            className={utils.getClassName('filename_progress', props)}
            percent={props.percent}
            status={props.progressStatus}
            showInfo={false}
            size="small"
          />
        ) : null}
      </div>
    </>
  );
};

export default FileNameContent;
