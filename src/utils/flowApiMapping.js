// 菜单 code → { api, status, isHandle } 动态映射表
// 旧项目 src/utils/flowApiMapping.js 迁移
export default {
  listApi: {
    // 分转岗
    dfp: { api: '/orderInfo/dfp_order_list', status: 1 },
    znjth: { api: '/orderInfo/znjth_order_list', status: 0 },
    fzgcb: { api: '/orderInfo/fzg_cb_order_list', status: 0 },
    dgj: { api: '/orderInfo/dgj_order_list', status: 6 },

    // 职能局
    djs: { api: '/orderInfo/djs_order_list', status: 2 },
    dfk: { api: '/orderInfo/dfk_order_list', status: 0 },
    shsw: { api: '/orderInfo/dsh_order_list', status: 4 },
    shswYn: { api: '/orderInfo/dsh_order_list', status: 4 },
    cbsw: { api: '/orderInfo/cb_order_list', status: 0 },
    xjcb: { api: '/orderInfo/xjcb_order_list', status: 8 },
    thgd: { api: '/orderInfo/th_order_list', status: 0 },
    xjyq: { api: '/orderInfo/xjyq_order_list', status: 0 },
    thsp: { api: '/orderInfo/thsp_order_list', status: 0 },

    // 回访岗
    dhf: { api: '/orderInfo/my_dhf_order_list', status: 3 },
    yyhf: { api: '/orderInfo/yyhf_order_list', status: 0 },
    dgd: { api: '/orderInfo/dgd_order_list', status: 5 },
    dgdYn: { api: '/orderInfo/dgd_order_list', status: 5 },
    dypgd: { api: '/orderInfo/dyp_order_list', status: 5 },
    yngd: { api: '/orderInfo/yn_order_list' },
    dxgd: { api: '/orderInfo/dx_order_list' },
    dbgd: { api: '/orderInfo/db_order_list' },
    gdsw: { api: '/orderInfo/gd_order_list' },
    yqgd: { api: '/orderInfo/yqgd_order_list', status: 0 },
    lhhf: { api: '/orderInfo/lhhf_order_list', status: 0 },
    hfrwc: { api: '/orderInfo/dhf_order_list' },

    // 审批
    yqsp: { api: '/orderInfo/dsp_order_list?key=yq', status: 0 },
    cbsp: { api: '/orderInfo/dsp_order_list?key=cb', status: 7 },
    dxsp: { api: '/orderInfo/dsp_order_list?key=dx', status: 0 },
    dbspgd: { api: '/orderInfo/dsp_order_list?key=db', status: 0 },
    bjrtj: { api: '/orderInfo/dsp_order_list?key=noStatistics', isHandle: true },

    // 批示
    yqps: { api: '/orderInfo/dsp_order_list?key=yq', status: 0 },
    ynps: { api: '/orderInfo/YnList', status: 0 },

    // 重复工单
    reBack: { api: '/orderInfo/reBack_order_list' },
    reAssign: { api: '/orderInfo/reAssign_order_list' },
    emphasis: { api: '/orderInfo/key_order_list' },

    fpps: { api: '/orderInfo/dsp_order_list?key=fpsb', status: 0 },
    sbdps: { api: '/orderInfo/sbqs_dsp', isHandle: true },

    // 信息查询
    hsz: { api: '/orderInfo/hsz_order_list' },
    myOrder: { api: '/orderInfo/myOrder' },
    myOrderSpecial: { api: '/orderInfoSpecial/myOrderSpecial' },
    focusOrder: { api: '/orderInfo/list_special_focus_order' },
    subOrderList: { api: '/orderInfo/subOrderList' },

    // 综合查询
    dcfOrder: { api: '/orderInfo/unfinishInterviewedAllList' },
    ycfOrder: { api: '/orderInfo/finishInterviewedAllList?taskName=上传工单附件' },
    jjcfOrder: { api: '/orderInfo/finishInterviewedAllList?taskName=班长驳回' },

    // 响应调度
    dspcf: { api: '/orderInfo/bzUnfinishInterviewedRuTaskList', isHandle: true },
    dclcf: { api: '/orderInfo/unfinishInterviewedListByUserId' },
    yblcf: { api: '/orderInfo/finishInterviewedListByUserId?taskName=上传工单附件' },
    bjcfOrder: { api: '/orderInfo/finishInterviewedListByUserId?taskName=班长驳回' },

    // 坐席首页
    tbgz: { api: '/orderInfo/tbgz_order_list' },
    jrwcgd: { api: '/orderInfo/today_over_order_list' },
    zxycqgd: { api: '/orderInfo/zxycq_order_list' },
    sjlylist: { api: '/orderInfo/zx_sjly_order_list' },

    // 分转岗首页
    fzgsp: { api: '/orderInfo/fzg_sp_order_list' },
    fzggdsp: { api: '/orderInfo/fzg_gdsp_order_list' },
    fzg_yyqgd: { api: '/orderInfo/fzg_yyqgd_order_list' },
    fzg_yqgd: { api: '/orderInfo/fzg_yqgd_order_list' },
    fzg_ldps: { api: '/orderInfo/fzg_ldps_order_list' },
    fzg_yfpgd: { api: '/orderInfo/fzg_yfpgd_order_list' },

    // 职能局调度中心
    znjdd_yyqgd: { api: '/orderInfo/znjdd_yyqgd_order_list' },
    znjdd_yqgd: { api: '/orderInfo/znjdd_yqgd_order_list' },
    znjdd_ldps: { api: '/orderInfo/znjdd_ldps_order_list' },
    znjdd_yfpgd: { api: '/orderInfo/znjdd_yfpgd_order_list' },

    // 职能局调度下级
    znjdd_sub_yyqgd: { api: '/orderInfo/znjdd_zsxjtj_yyqorder_list' },
    znjdd_sub_yqgd: { api: '/orderInfo/znjdd_zsxjtj_yqorder_list' },
    znjdd_sub_djsgd: { api: '/orderInfo/znjdd_zsxjtj_djsorder_list' },
    znjdd_sub_cbgd: { api: '/orderInfo/znjdd_zsxjtj_againorder_list' },

    // 职能局
    znj_yyqgd: { api: '/orderInfo/znj_yyqgd_order_list' },
    znj_yqgd: { api: '/orderInfo/yqgd_order_list' },
    znj_ysbgd: { api: '/orderInfo/znj_sbgd_order_list' },
    znj_login_logs: { api: '/sysLoginoutLogs/listLoginOrLogout' },
    znj_dyp: { api: '/orderInfo/dyp_my_order_list' },
    znjld_dps: { api: '/orderInfo/dps_order_list', isHandle: true },

    // 回访
    hf_csdhfgd: { api: '/orderInfo/hf_csdhfgd_order_list' },
    hf_yhfgd: { api: '/orderInfo/hf_yhfgd_order_list' },
    hf_yhfcs: { api: '/orderInfo/hf_gdhfcs_order_list' },
    dypzsw: { api: '/orderInfo/dyp_all_order_list' },

    // 督查中心
    dbsp_sqd: { api: '/orderInfo/dbsp_sqd', isHandle: true },
    dbsp_bydb: { api: '/orderInfo/yjsh_bydb' },
    dbsp_ghdb: { api: '/orderInfo/registeredSupervisor', isHandle: true },
    spdc_allOverDueOrder: { api: '/orderInfo/allOverDueOrder', isHandle: true },
    spdc_allNonResponse: { api: '/orderInfo/allNonResponse', isHandle: true },
    spdc_allHfDissatisfied: { api: '/orderInfo/allHfDissatisfied', isHandle: true },
    spdc_allNormalOrder: { api: '/orderInfo/allNormalOrder', isHandle: true },
    spdc_allDoneOrder: { api: '/orderInfo/allDoneOrder' },
    spt_dcdb: { api: '/orderInfo/supervisionInspector', isHandle: true },
    spt_jcdb: { api: '/orderInfo/monitorInspector', isHandle: true },

    ghdb_ddydb: { api: '/orderInfo/registeredSupervisor' },
    ghdb_dbz: { api: '/orderInfo/supervisingAll', isHandle: true },
    dbbj_lsdb: { api: '/orderInfo/historySupervise' },

    sqd: { api: '/orderInfo/yjsh_sqd', isHandle: true },
    yjsh_dbspz: { api: '/orderInfo/yjsh_dbspz' },
    yjsh_bydb: { api: '/orderInfo/yjsh_bydb', isHandle: true },
    supervising: { api: '/orderInfo/supervising', isHandle: false },

    yjrwd: { api: '/orderInfo/warningOrder?queryTpye=2', isHandle: true },
    dbspz: { api: '/orderInfo/dbspzOrder' },
    bydb: { api: '/orderInfo/bydbOrder' },
    dbz: { api: '/orderInfo/dbzOrder' },
    dbgd_yjdb: { api: '/orderInfo/dbzSuperviseOrder', isHandle: true },

    yjdb: { api: '/orderInfo/warningOrder?queryTpye=1' },
    xyOrder: { api: '/orderInfo/xyOrder' },
    rwOrder: { api: '/orderInfo/rwOrder' },
    dbOrder: { api: '/orderInfo/dbOrder' },

    SampleLibrary: { api: '/orderInfo/integrated_query_order?cwFlag=ybk' },
    orderSearch: { api: '/orderInfo/integrated_query_order?cwFlag=ybk' },
    orderSearchCy: { api: '/orderInfo/integrated_query_order?cwFlag=chsybk' }
  }
}
