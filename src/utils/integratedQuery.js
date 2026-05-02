export default {
  handleType: [
    { dictId: '0', dictName: '暂存' }, { dictId: '1', dictName: '直接答复' },
    { dictId: '2', dictName: '交办' }, { dictId: '3', dictName: '不予受理' },
    { dictId: '4', dictName: '无效电话' }, { dictId: '6', dictName: '申请疑难' },
    { dictId: '7', dictName: '关联' }
  ],
  orderSubState: [
    { dictId: '9', dictName: '暂存' }, { dictId: '6', dictName: '待分派' },
    { dictId: '11', dictName: '疑难' }, { dictId: '3', dictName: '分转岗退回' },
    { dictId: '4', dictName: '退回' }, { dictId: '17', dictName: '职能局退回' },
    { dictId: '1', dictName: '待接收' }, { dictId: '2', dictName: '待反馈' },
    { dictId: '12', dictName: '待跟进' }, { dictId: '8', dictName: '重办' },
    { dictId: '15', dictName: '逾期' }, { dictId: '5', dictName: '待回访' },
    { dictId: '7', dictName: '已回访' }, { dictId: '10', dictName: '已预约回访' },
    { dictId: '13', dictName: '待审核' }, { dictId: '99', dictName: '已归档' },
    { dictId: '14', dictName: '重办待批示' }, { dictId: '18', dictName: '待研判' },
    { dictId: '24', dictName: '向省级申请退回' }
  ],
  orderSubStateE: [
    { dictId: '8', dictName: '重办' }, { dictId: '15', dictName: '逾期' },
    { dictId: '11', dictName: '疑难' }, { dictId: '12', dictName: '待跟进' },
    { dictId: '100', dictName: '关联事务' }, { dictId: '101', dictName: '联合办理' },
    { dictId: '102', dictName: '二级联合办理' }, { dictId: '103', dictName: '继续受理' },
    { dictId: '104', dictName: '重启流程' }, { dictId: '105', dictName: '延期' },
    { dictId: '106', dictName: '重新回访' }, { dictId: '4', dictName: '退回' },
    { dictId: '107', dictName: '分转岗退回' }, { dictId: '108', dictName: '二级部门退回' },
    { dictId: '109', dictName: '三级部门退回' }
  ],
  transferInfo: [
    { dictId: '0', dictName: '未转接' }, { dictId: '1', dictName: '已接通' }, { dictId: '2', dictName: '未接通' }
  ],
  handleInfo: [
    { dictId: '2', dictName: '解决' }, { dictId: '1', dictName: '部分解决' }, { dictId: '0', dictName: '未解决' }
  ],
  qualityLabelId: [
    { dictId: '1', dictName: '优秀事务' }, { dictId: '2', dictName: '较差事务' }
  ],
  satisfactionss: [
    { dictId: 3, dictName: '非常满意' }, { dictId: 2, dictName: '满意' },
    { dictId: 1, dictName: '理解' }, { dictId: 0, dictName: '不满意' }
  ],
  zxAppraise: [
    { dictId: 3, dictName: '非常满意' }, { dictId: 2, dictName: '满意' },
    { dictId: 1, dictName: '理解' }, { dictId: 0, dictName: '不满意' }
  ],
  isFollow: [
    { dictId: 0, dictName: '否' }, { dictId: 1, dictName: '是' }
  ]
}
