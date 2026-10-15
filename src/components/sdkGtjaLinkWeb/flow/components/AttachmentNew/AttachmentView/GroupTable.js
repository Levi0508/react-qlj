import React from 'react';
import { Table } from 'antd';
import utils from '../../../../utils/utils';
import './styles.less';
export const GroupTable = props => {
  const { columns, dataSource, rowSelection, title,contentType } = props;
  return (
    <div>
      <h2 style={{ margin: 0, padding: '10px 0', fontSize: '16px' }}>{title ? title : ''}</h2>
      {/* <div style={{ padding: '0 20px' }}> */}
      <div className='attachmentViewTable'>
        <Table
          rowSelection={(!contentType && contentType !== 'print') && {
            type: 'checkbox',
            ...rowSelection,
          }}
          showHeader={false}
          pagination={false}
          bordered
          columns={columns}
          dataSource={dataSource}
          className={utils.getClassName('attachment_view', props)}
        />
      </div>
    </div>
  );
};
