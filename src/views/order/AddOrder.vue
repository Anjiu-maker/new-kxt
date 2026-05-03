<script setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Container from "@/components/Container.vue";
import Orderinfo from "@/components/Orderinfo.vue";
import Audio from "@/components/Audio.vue";
import SelectDeptOrUser from "@/components/SelectDeptOrUser.vue";
import {
  saveOrder,
  getOrderDetail,
  getOrderList,
  getDeptTree,
} from "@/services/orderService";
import { useAuthStore } from "@/stores/auth";
import { useGlobal } from "@/composables/useGlobal";
import { useCtiStore } from "@/stores/cti";
import { http } from "@/services/http";

const props = defineProps({
  pageName: { type: String, default: "" },
  query: { type: Object, default: () => ({}) },
});
const authStore = useAuthStore();
const ctiStore = useCtiStore();
const workbenchNav = inject("workbenchNav", null);
const { getDictByCode } = useGlobal();

// ── 核心状态 ──
const loading = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const orderId = ref("");
const qzbz = ref(true);
const activeClass = ref(0);
const audioWinMaster = ref(false);
const audioUrlMaster = ref("");
const audioCallId = ref("");
const gdxqwin = ref(false);
const orderInfoRef = ref();
const deptAndUserRef = ref();
const isTelAddZero = ref(false);
const isSpt = ref(false);
const is110 = ref(false);
const isMustSl = ref(false);
const recommendedDeptActive = ref(false);
const groupOptions = ref([]);
const tel1 = ref("");
const tel2 = ref("");
const sendMessage = ref(false);

// ── 表单模型 ──
const initModel = () => ({
  orderId: "",
  orderNo: "",
  name: "",
  callTel: "",
  sex: "",
  ageRange: "",
  ageRangeName: "",
  shotMessageNumber: "",
  isBzpth: 1,
  portrait: [],
  addr: "",
  idcard: "",
  massesRemarks: "",
  isNative: 1,
  isNameSecurity: 0,
  isTelAddZero: false,
  orderTagName: "个人",
  orderOrigin: "",
  orderOriginName: "",
  orderOrigin2: "",
  orderOrigin2Name: "",
  orderOrigin3: "",
  orderOrigin3Name: "",
  orderType: "",
  orderTypeName: "",
  orderLevel: "",
  orderLevelValue: "",
  orderLevelName: "",
  deptId: "",
  deptName: "",
  dept1Id: "",
  dept2Id: "",
  dept3Id: "",
  dept4Id: "",
  dept5Id: "",
  handlerDeptId: null,
  handlerDeptName: "",
  title: "",
  orderAddr: "",
  callerContent: "",
  contentRemark: "",
  secrecyInfo: "",
  incidentTime: "",
  handleType: 1,
  handleTypeName: "直接答复",
  handleEndTime: "",
  transferInfo: 0,
  transferInfoName: "",
  acceptCenterIdea: "",
  groupLeaderOpinion: "",
  emotion: "",
  hotspot1: "",
  hotspot1Name: "",
  hotspot2: "",
  hotspot2Name: "",
  specialWork: "",
  messageCode: "",
  messageName: "",
  messageContent: "",
  haveSound: 0,
  haveSoundName: "",
  isContinueAccept: 0,
  isManualOpenPage: 1,
  relevantOrderNode: null,
  callId: "",
  recordFile: null,
  lng: null,
  lat: null,
  subDeptId: "",
  hffs: 6,
  releaseContent: "",
});
const model = reactive(initModel());

const sexOptions = [
  { label: "男", value: "1" },
  { label: "女", value: "0" },
];
const ageRangeOptions = [];
const portraitOptions = [];
const emotionOptions = [];
const orderTagOptions = [
  { label: "个人", value: "个人" },
  { label: "企业", value: "企业" },
];
const bzpthOptions = [
  { label: "是", value: 1 },
  { label: "否", value: 0 },
];
const isNativeOptions = [
  { label: "是", value: 1 },
  { label: "否", value: 0 },
];
const handleTypeOptions = [
  { label: "直接答复", value: 1 },
  { label: "交办", value: 2 },
  { label: "不予受理", value: 3 },
  { label: "无效电话", value: 4 },
  { label: "暂存", value: 0 },
  { label: "申请疑难", value: 6 },
  { label: "关联", value: 7 },
  { label: "退回省平台", value: 10 },
];
const transferInfoOptions = [
  { label: "未接通", value: 1 },
  { label: "已接通", value: 2 },
];
const hffsOptions = [
  { label: "短信邀评", value: 1 },
  { label: "微信邀评", value: 2 },
  { label: "智能语音回访", value: 3 },
  { label: "人工语音回访", value: 4 },
  { label: "等待自行评价", value: 5 },
  { label: "随统一回访流程", value: 6 },
];

const swlyOptions = ref([]);
const orderTypeOptions = ref([]);
const orderLevelOptions = ref([]);
const wtsdOptions = ref([]);
const ywdwOptions = ref([]);
const hotspotOptions = ref([]);
const specialWorkOptions = ref([]);
const messageTemplateOptions = ref([]);

// 右侧面板
const zskList = ref([]);
const zskKeyword = ref("");
const blxxList = ref([]);
const lsgdList = ref([]);
const xggdList = ref([]);
const lostgdList = ref([]);
const rxList = ref([]);
const zskPageInfo = reactive({ pageNum: 1, pageSize: 10, total: 0 });
const xggdParams = reactive({ startTime: "", endTime: "" });

// 弹窗
const cbFormVisible = ref(false);
const cbModel = reactive({
  orderId: "",
  urgeContent: "",
  isSendMessage: false,
});
const zsdDetailVisible = ref(false);
const zsdDetail = ref({});
const uploadFileWin = ref(false);
const isShowFj = ref(false);
const fjList = ref([]);
const messageTemplateVisible = ref(false);

const uploadAction = computed(
  () => (window.common?.baseApi || "") + "/uploadFile/upload",
);
const uploadHeaders = computed(() => {
  const t =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    "";
  return t ? { token: t } : {};
});
const userInfo = computed(() => authStore.userInfo ?? {});

// ── 工具 ──
const fmtT = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// ── 字典加载 ──
async function loadDicts() {
  try {
    const [
      originRes,
      types,
      levelRes,
      wtsdRes,
      ywdwRes,
      hotspots,
      specialWorks,
      ageRanges,
      emotions,
      portraits,
    ] = await Promise.all([
      http.get("/user/getCurrentUserChannel"),
      getDictByCode(false, "swlx"),
      http.get("/order_level/list", { params: { flag: false } }),
      http.get("/dept/tree_nodetype", {
        params: { nodetype: 1, isHeader: false },
      }),
      getDeptTree(false),
      getDictByCode(true, "rdfl"),
      getDictByCode(false, "zxgz"),
      getDictByCode(false, "ageRange"),
      getDictByCode(false, "qzqx"),
      getDictByCode(false, "rwhx"),
    ]);
    swlyOptions.value =
      originRes?.data?.code === 200 ? originRes.data.data || [] : [];
    swlyOptions.value.forEach((item) => {
      if (item.dictId === 2362) item.disabled = true;
    });
    orderTypeOptions.value = types || [];
    orderLevelOptions.value =
      levelRes?.data?.code === 200 ? levelRes.data.data || [] : [];
    wtsdOptions.value = wtsdRes?.data?.data || [];
    ywdwOptions.value = ywdwRes?.data?.data || [];
    hotspotOptions.value = hotspots || [];
    specialWorkOptions.value = specialWorks || [];
    ageRangeOptions.splice(
      0,
      ageRangeOptions.length,
      ...(ageRanges || []).map((d) => ({ label: d.dictName, value: d.dictId })),
    );
    emotionOptions.splice(
      0,
      emotionOptions.length,
      ...(emotions || []).map((d) => ({ label: d.dictName, value: d.dictId })),
    );
    portraitOptions.splice(
      0,
      portraitOptions.length,
      ...(portraits || []).map((d) => ({ label: d.dictName, value: d.dictId })),
    );
    if (!props.query?.orderId) {
      if (!model.orderOrigin && swlyOptions.value.length)
        model.orderOrigin = getDefaultOriginPath(swlyOptions.value);
      if (!model.orderType && orderTypeOptions.value.length)
        model.orderType = orderTypeOptions.value[0].dictId;
      if (!model.emotion && emotionOptions.length)
        model.emotion = emotionOptions[0].value;
      if (!model.orderLevel && orderLevelOptions.value.length)
        await changeOrderLevel(orderLevelOptions.value[0].levelId);
    }
    await nextTick();
    if (deptAndUserRef.value)
      deptAndUserRef.value.setDeptData({ deptOptions: ywdwOptions.value });
  } catch { }
}

// ── 选项/提交数据同步 ──
function getDefaultOriginPath(options) {
  const first = options?.[0];
  if (!first) return [];
  return first.children?.[0]
    ? [first.dictId, first.children[0].dictId]
    : [first.dictId];
}

function normalizeSelectedPath(value) {
  return Array.isArray(value)
    ? value.filter((v) => v !== "" && v !== null && v !== undefined)
    : value
      ? [value]
      : [];
}

function leafValue(value) {
  const path = normalizeSelectedPath(value);
  return path.length ? path[path.length - 1] : "";
}

function findTreePath(tree, ids, idKey = "dictId") {
  const idList = normalizeSelectedPath(ids);
  if (!idList.length) return [];
  const walk = (nodes, depth = 0, path = []) => {
    for (const node of nodes || []) {
      if (node?.[idKey] == idList[depth]) {
        const nextPath = [...path, node];
        if (depth === idList.length - 1) return nextPath;
        const childPath = walk(node.children, depth + 1, nextPath);
        if (childPath.length) return childPath;
      }
    }
    return [];
  };
  return walk(tree);
}

async function changeOrderLevel(levelId) {
  model.orderLevel = levelId || "";
  const level = orderLevelOptions.value.find((item) => item.levelId == levelId);
  model.orderLevelName = level?.levelName || "";
  model.orderLevelValue = level?.handleDays || "";
  if (!levelId || !level?.handleDays) return;
  try {
    const startTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    const res = await http.get("/orderInfo/getHandleEndTime", {
      params: {
        startTime,
        orderLevelValue: level.handleDays,
        orderLevel: levelId,
      },
    });
    if (res.data?.code === 200) model.handleEndTime = res.data.data || "";
  } catch { }
}

function buildSubmitPayload(extra = {}) {
  const payload = { ...model, ...extra };

  const originPath = normalizeSelectedPath(model.orderOrigin);
  const originNodes = findTreePath(swlyOptions.value, originPath);
  [0, 1, 2].forEach((i) => {
    const suffix = i ? i + 1 : "";
    payload[`orderOrigin${suffix}`] = originPath[i] || "";
    payload[`orderOrigin${suffix}Name`] = originNodes[i]?.dictName || "";
  });

  const hotspotPath = normalizeSelectedPath(model.hotspot1);
  const hotspotNodes = findTreePath(hotspotOptions.value, hotspotPath);
  for (let i = 0; i < 5; i++) {
    payload[`hotspot${i + 1}`] = hotspotPath[i] || "";
    payload[`hotspot${i + 1}Name`] = hotspotNodes[i]?.dictName || "";
  }

  const deptPath = normalizeSelectedPath(model.deptId);
  const deptNodes = findTreePath(wtsdOptions.value, deptPath, "deptId");
  payload.deptId = leafValue(model.deptId) || payload.deptId;
  payload.deptName =
    deptNodes[deptNodes.length - 1]?.deptName || payload.deptName || "";
  for (let i = 0; i < 5; i++) payload[`dept${i + 1}Id`] = deptPath[i] || "";

  const orderType = orderTypeOptions.value.find(
    (item) => item.dictId == model.orderType,
  );
  const level = orderLevelOptions.value.find(
    (item) => item.levelId == model.orderLevel,
  );
  payload.orderTypeName = orderType?.dictName || payload.orderTypeName || "";
  payload.orderLevelName = level?.levelName || payload.orderLevelName || "";
  payload.orderLevelValue = level?.handleDays || payload.orderLevelValue || "";
  payload.handleTypeName =
    handleTypeOptions.find((item) => item.value == model.handleType)?.label ||
    payload.handleTypeName ||
    "";
  payload.transferInfoName =
    transferInfoOptions.find((item) => item.value == model.transferInfo)
      ?.label ||
    payload.transferInfoName ||
    "";
  return payload;
}

// ── 来电弹屏模式检测 ──
function detectScreenPopMode() {
  const q = props.query || {};
  if (q.orderId) {
    isEdit.value = true;
    orderId.value = q.orderId;
    return "edit";
  }
  if (q.tel) {
    model.callTel = q.tel;
    model.incidentTime = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    queryCitizen(q.tel);
    return "telpop";
  }
  if (q.editTel) {
    model.callTel = q.editTel;
    return "editTel";
  }
  if (q.isHiCallRecord) {
    model.callTel = q.isHiCallRecord;
    model.isManualOpenPage = 0;
    return "callRecord";
  }
  if (q.oldCallId) {
    model.callId = q.oldCallId;
    return "lostCall";
  }
  if (q.isMsgOrigin) {
    model.callTel = q.isMsgOrigin;
    return "msgOrigin";
  }
  return "normal";
}

// ── 市民信息反查 ──
async function queryCitizen(tel) {
  if (!tel) return;
  try {
    const r = await http.get("/orderCitizen/queryCitizen", {
      params: { callTel: tel },
    });
    if (r.data?.code === 200 && r.data.data) {
      const d = r.data.data;
      if (!model.name) model.name = d.name || "";
      if (!model.sex) model.sex = d.sex || "";
      if (!model.addr) model.addr = d.addr || "";
      if (!model.idcard) model.idcard = d.idcard || "";
    }
  } catch { }
}

// ── 加载已有工单 ──
async function loadOrderData() {
  const oid = props.query?.orderId;
  if (!oid) return;
  isEdit.value = true;
  orderId.value = oid;
  try {
    const r = await getOrderDetail(
      props.query?.orderNo || "",
      authStore.hasPermission("lookOrderInfo", 1),
    );
    if (r.data?.code === 200) {
      const d = r.data.data;
      const fields = [
        "name",
        "callTel",
        "sex",
        "addr",
        "title",
        "callerContent",
        "orderOrigin",
        "orderOrigin2",
        "orderOrigin3",
        "orderType",
        "orderLevel",
        "handlerDeptId",
        "handlerDeptName",
        "deptId",
        "deptName",
        "orderAddr",
        "handleType",
        "handleEndTime",
        "haveSound",
        "haveSoundName",
        "acceptCenterIdea",
        "contentRemark",
        "specialWork",
        "isNameSecurity",
        "incidentTime",
        "emotion",
        "hotspot1",
        "hotspot2",
        "orderTagName",
        "ageRange",
        "shotMessageNumber",
        "idcard",
        "massesRemarks",
        "isBzpth",
        "isNative",
        "portrait",
        "transferInfo",
        "secrecyInfo",
        "groupLeaderOpinion",
        "messageCode",
        "messageName",
        "messageContent",
        "releaseContent",
      ];
      fields.forEach((f) => {
        if (d[f] !== undefined) model[f] = d[f];
      });
      model.orderId = d.orderId || "";
      model.orderNo = d.orderNo || "";
      model.isNameSecurity = d.isNameSecurity === 1 ? 1 : 0;
      model.orderOrigin = [
        d.orderOrigin,
        d.orderOrigin2,
        d.orderOrigin3,
      ].filter((v) => v !== undefined && v !== null && v !== "");
      model.hotspot1 = [
        d.hotspot1,
        d.hotspot2,
        d.hotspot3,
        d.hotspot4,
        d.hotspot5,
      ].filter((v) => v !== undefined && v !== null && v !== "");
      const deptPath = [
        d.dept1Id,
        d.dept2Id,
        d.dept3Id,
        d.dept4Id,
        d.dept5Id,
      ].filter((v) => v !== undefined && v !== null && v !== "");
      if (deptPath.length) model.deptId = deptPath;
      if (model.callTel) {
        getlsgdList();
        getblxxList();
      }
    }
  } catch { }
}

// ── 提交 ──
function getSubmitApi() {
  if (model.handleType === 6) return "/orderInfo/applyDifficult";
  return isEdit.value && model.handleType !== 0
    ? "/orderInfo/zx_submit"
    : "/orderInfo/save";
}

async function handleSubmit(continueAccept = false) {
  if (!model.title) {
    ElMessage.warning("请输入标题");
    return;
  }
  if (!model.callerContent) {
    ElMessage.warning("请输入内容");
    return;
  }
  try {
    submitLoading.value = true;
    const payload = buildSubmitPayload({ isTelAddZero: isTelAddZero.value });
    if (isEdit.value) payload.orderId = orderId.value;
    payload.isContinueAccept = continueAccept ? 1 : 0;
    payload.isSubmit = continueAccept ? "" : "1";
    payload.isSendMassMessage = sendMessage.value;
    const r = await http.post(getSubmitApi(), payload);
    if (r.data?.code === 200) {
      ElMessage.success(continueAccept ? "保存成功，继续受理" : "提交成功");
      if (continueAccept) {
        jxslHandlerModel();
        return;
      }
      workbenchNav?.openMenuByCode("zcsw");
    } else {
      ElMessage.error(r.data?.message || "操作失败");
    }
  } catch {
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
}

// ── 继续受理：重置表单保留电话/姓名 ──
function jxslHandlerModel() {
  const keep = {
    callTel: model.callTel,
    name: model.name,
    addr: model.addr,
    sex: model.sex,
    isNameSecurity: model.isNameSecurity,
    orderOrigin: model.orderOrigin,
    orderOrigin2: model.orderOrigin2,
  };
  const fresh = initModel();
  Object.keys(fresh).forEach((k) => {
    if (keep[k] !== undefined) fresh[k] = keep[k];
  });
  Object.assign(model, fresh);
  model.incidentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  isTelAddZero.value = false;
}

// ── 加拨0 ──
function add0Click() {
  if (!model.callTel) return;
  if (model.callTel.startsWith("0")) {
    model.callTel = model.callTel.substring(1);
    isTelAddZero.value = false;
  } else {
    model.callTel = "0" + model.callTel;
    isTelAddZero.value = true;
  }
}

// ── 保密日志 ──
async function addSecurityLog() {
  if (!model.orderId) return;
  try {
    await http.post("/orderLog/save", {
      orderId: model.orderId,
      type: model.isNameSecurity ? "改保密" : "改不保密",
    });
  } catch { }
}
watch(
  () => model.isNameSecurity,
  () => {
    if (isEdit.value) addSecurityLog();
  },
);

// ── CTI 电话 ──
function hujiao(tel) {
  if (!tel) return;
  ctiStore.ctiHujiao({ tel, orderId: model.orderId, type: 1 });
}
function guaduan(tel) {
  if (!tel) return;
  ctiStore.ctiGuaduan({ tel });
}
function createThreeCall(tel) {
  if (!tel) return;
  ctiStore.ctiHujiao({ tel, orderId: model.orderId, type: 2 }); // 三方通话-创建
}
function restoreCall() {
  ctiStore.ctiHujiao({ type: 3 });
} // 三方通话-恢复
function blindTransferFn(tel) {
  if (!tel) {
    ElMessage.warning("请输入转接号码");
    return;
  }
  ElMessage.info("盲转功能待后续接入");
}

// ── 服务渠道变更监听 ──
watch(
  () => model.orderOrigin,
  (val) => {
    if (!val || !Array.isArray(val) || !val.length) return;
    const originName =
      swlyOptions.value.find((o) => o.dictId === val[0])?.dictName || "";
    isSpt.value = originName === "省平台渠道";
    is110.value = originName === "110平台";
    isMustSl.value = originName === "省平台渠道";
    if (originName === "省平台渠道") model.hffs = 6;
  },
);

// ── 右侧面板 ──
async function searchZsk() {
  try {
    const r = await http.get("/knowledgeBase/findHistoryOrderByTitle", {
      params: {
        title: zskKeyword.value || "",
        pageNum: zskPageInfo.pageNum,
        pageSize: zskPageInfo.pageSize,
      },
    });
    if (r.data?.code === 200) {
      zskList.value = r.data.data?.records || [];
      zskPageInfo.total = r.data.data?.total || 0;
    }
  } catch {
    zskList.value = [];
  }
}
async function getblxxList() {
  try {
    const r = await getOrderList("/orderInfo/listOrderByTime", { pageSize: 5 });
    if (r.data?.code === 200) blxxList.value = r.data.data?.records || [];
  } catch {
    blxxList.value = [];
  }
}
async function getlsgdList() {
  if (!model.callTel) return;
  try {
    const r = await getOrderList("/orderInfo/findHistoryOrderByCallTel", {
      callTel: model.callTel,
      pageSize: 10,
    });
    if (r.data?.code === 200) lsgdList.value = r.data.data?.records || [];
  } catch {
    lsgdList.value = [];
  }
}
async function searchOrigin() {
  try {
    const r = await getOrderList("/orderInfo/findOrderByHotSpot", {
      title: model.title,
      content: model.callerContent,
      pageSize: 10,
      startTime: xggdParams.startTime,
      endTime: xggdParams.endTime,
    });
    if (r.data?.code === 200) xggdList.value = r.data.data?.records || [];
  } catch {
    xggdList.value = [];
  }
}
async function searchLost() {
  try {
    const r = await getOrderList("/orderInfo/findOrderByHotSpot", {
      pageSize: 10,
    });
    if (r.data?.code === 200) lostgdList.value = r.data.data?.records || [];
  } catch {
    lostgdList.value = [];
  }
}
async function loadRxList() {
  try {
    const r = await http.get("/sys/params/find", { params: { code: "rxNum" } });
    if (r.data?.code === 200 && r.data.data?.value)
      rxList.value = r.data.data.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  } catch {
    rxList.value = [];
  }
}
function zskViewDetail(item) {
  http
    .get("/knowledgeBase/zsk_knowledge_one", {
      params: { id: item.klKnowledgeId || item.id, isSave: 1 },
    })
    .then((r) => {
      if (r.data?.code === 200) {
        zsdDetail.value = r.data.data || {};
        zsdDetailVisible.value = true;
      }
    });
}
function useKnowledge() {
  model.acceptCenterIdea =
    (model.acceptCenterIdea || "") +
    "\n" +
    (zsdDetail.value.title || "") +
    ": " +
    (zsdDetail.value.content || "");
  zsdDetailVisible.value = false;
  ElMessage.success("已引用");
}

// ── 关联工单 ──
function glRow(row) {
  if (row.orderId === model.orderId) return;
  model.relevantOrderNode = row.orderNo;
  ElMessage.success("已关联: " + row.orderNo);
}
function qxgl() {
  model.relevantOrderNode = null;
  ElMessage.success("已取消关联");
}
function setGlDisabled(row) {
  return (
    row.orderSubState === 99 || row.isOverdue === 1 || row.orderSubState === 9
  );
} // 归档/逾期/暂存不能关联

// ── 催办 ──
function cbClick(row) {
  cbModel.orderId = row.orderId;
  cbModel.urgeContent = "";
  cbFormVisible.value = true;
}
async function cbSubmit() {
  try {
    const r = await http.get("/orderInfo/addUrgeSupervise", {
      params: {
        orderId: cbModel.orderId,
        urgeContent: cbModel.urgeContent,
        isSendMessage: cbModel.isSendMessage,
      },
    });
    if (r.data?.code === 200) {
      ElMessage.success("催办成功");
      cbFormVisible.value = false;
    } else ElMessage.error(r.data?.message || "催办失败");
  } catch {
    ElMessage.error("催办失败");
  }
}

// ── 附件 ──
function beforeUpload(f) {
  if (!/\.(doc|docx|pdf|jpeg|jpg|png|mp4|mp3|wav|m4a|zip|rar)$/i.test(f.name)) {
    ElMessage.error("不支持的文件格式");
    return false;
  }
  if (f.size > 30 * 1024 * 1024) {
    ElMessage.error("不超过30MB");
    return false;
  }
  return true;
}
function handleUploadSuccess(r) {
  if (r?.code === 200 || r?.data?.code === 200) {
    ElMessage.success("上传成功");
    loadFjList();
  }
}
async function loadFjList() {
  try {
    const r = await http.get("/orderAttachmentRecoding/list", {
      params: { orderId: orderId.value || 0, pageSize: 20 },
    });
    if (r.data?.code === 200) fjList.value = r.data.data?.records || [];
  } catch {
    fjList.value = [];
  }
}

// ── 智能推荐 ──
async function recommendedDept() {
  const hotspotIds = normalizeSelectedPath(model.hotspot1);
  if (!hotspotIds.length) return;
  try {
    const r = await http.get("/hotspotDept/recommend", {
      params: {
        hotspot: hotspotIds[hotspotIds.length - 1],
        hitHotSpotIds: hotspotIds.join(","),
        hitDeptId: model.dept1Id || "",
      },
    });
    if (r.data?.code === 200) {
      const data = r.data.data || [];
      groupOptions.value = data.flatMap((item) =>
        Array.isArray(item?.options) ? item.options : item?.deptId ? [item] : [],
      );
      recommendedDeptActive.value = groupOptions.value.length > 0;
    }
  } catch { }
}
function selectRecommendedDept(dept) {
  model.handlerDeptId = dept.deptId;
  model.handlerDeptName = dept.deptName;
  deptAndUserRef.value?.setCurrentDept(dept.deptId, dept.deptName);
  recommendedDeptActive.value = false;
  getDeptTels(dept.deptId);
}
async function getDeptTels(deptId) {
  try {
    const r = await http.get("/dept/find", { params: { deptId } });
    if (r.data?.code === 200) {
      tel1.value = r.data.data?.tel || "";
      tel2.value = r.data.data?.tel2 || "";
    }
  } catch {
    tel1.value = "";
    tel2.value = "";
  }
}

// ── 热点绑定部门 ──
async function getBindDept(hotspot) {
  if (!hotspot) return;
  try {
    const r = await http.get("/dict/getBindDept", { params: { hotspot } });
    if (r.data?.code === 200 && r.data.data?.deptId) {
      model.handlerDeptId = r.data.data.deptId;
      model.handlerDeptName = r.data.data.deptName;
      deptAndUserRef.value?.setCurrentDept(
        r.data.data.deptId,
        r.data.data.deptName,
      );
      getDeptTels(r.data.data.deptId);
    }
  } catch { }
}
watch(
  () => model.hotspot1,
  (val) => {
    const hotspot = leafValue(val);
    if (hotspot) getBindDept(hotspot);
  },
);

// ── AI 智能提取 ──
async function contentByHandlerDeptId() {
  const content = `${model.title || ""}${model.callerContent || ""}`;
  if (!content) return;
  try {
    const r = await http.get("/externalInterface/getRecommendationDept", {
      params: {
        content,
        orderId: model.orderId || orderId.value || "",
      },
    });
    const dept = r.data?.data || {};
    if (r.data?.code === 200 && dept.deptId) {
      model.handlerDeptId = dept.deptId;
      model.handlerDeptName = dept.deptName || "";
      deptAndUserRef.value?.setCurrentDept(dept.deptId, dept.deptName);
      getDeptTels(dept.deptId);
    }
  } catch { }
}

function firstEntity(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (Array.isArray(value) && value.length) return value[0]?.text || value[0];
    if (value?.text) return value.text;
    if (typeof value === "string") return value;
  }
  return "";
}

function applyOrderTypeByText(text) {
  if (!text) return;
  const type = orderTypeOptions.value.find(
    (item) => item.dictName?.includes(text) || `${text}类` === item.dictName,
  );
  if (type) {
    model.orderType = type.dictId;
    model.orderTypeName = type.dictName;
  }
}

function applyHotspotPath(path) {
  const ids = normalizeSelectedPath(path);
  model.hotspot1 = ids;
  for (let i = 0; i < 5; i++) {
    model[`hotspot${i + 1}`] = ids[i] || "";
  }
}

async function intelligentExtraction() {
  if (!model.callerContent) {
    ElMessage.warning("请输入内容后进行智能提取");
    return;
  }
  contentByHandlerDeptId();
  getHotType();
  getMindTitle();
  try {
    const r = await http.get("/externalInterface/getExtraction", {
      params: { text: model.callerContent },
    });
    if (r.data?.code === 200) {
      const d = r.data.data?.result?.[0] || r.data.data || {};
      const name = firstEntity(d, ["姓名", "name", "fullname"]);
      const addr = firstEntity(d, ["地址", "addr", "address"]);
      const time = firstEntity(d, ["时间", "time"]);
      const event = firstEntity(d, ["事件", "event", "title", "subject"]);
      const type = firstEntity(d, ["类型", "type", "order"]);
      const org = firstEntity(d, ["组织机构", "dept", "organization"]);
      if (name && !model.name) model.name = name;
      if (addr) model.orderAddr = addr;
      if (time && !model.incidentTime) model.incidentTime = time;
      if (event && !model.title) model.title = event;
      if (org && !model.handlerDeptName) model.handlerDeptName = org;
      applyOrderTypeByText(type);
      ElMessage.success("智能提取完成");
    }
  } catch {
    ElMessage.warning("智能提取失败");
  }
}
async function getHotType() {
  if (!model.callerContent) {
    ElMessage.warning("请输入内容后进行热点推荐");
    return;
  }
  try {
    const r = await http.get("/externalInterface/getHotType", {
      params: {
        content: model.callerContent,
        orderId: model.orderId || orderId.value || "",
      },
    });
    if (r.data?.code === 200) {
      const list = r.data.data?.data || r.data.data || [];
      const first = Array.isArray(list) ? list[0] : list;
      const path = Array.isArray(first)
        ? first
        : first?.path || first?.ids || (first?.dictId ? [first.dictId] : []);
      if (path.length) {
        applyHotspotPath(path);
        recommendedDept();
      }
    }
  } catch { }
}
async function getMindTitle() {
  if (!model.callerContent) {
    ElMessage.warning("请输入内容后进行标题推荐");
    return;
  }
  try {
    const r = await http.get("/externalInterface/getMindTitle", {
      params: { text: model.callerContent },
    });
    if (r.data?.code === 200 && r.data.data && !model.title)
      model.title = r.data.data;
  } catch { }
}

// ── 高危词检测 ──
async function highRiskSign() {
  if (!model.callerContent) return;
  try {
    const r = await http.get("/highRisk/sign", {
      params: { content: model.callerContent },
    });
    if (r.data?.code === 200 && r.data.data) {
      ElMessage.warning("检测到高危词: " + r.data.data);
    }
  } catch { }
}
watch(
  () => model.callerContent,
  () => {
    if (model.callerContent && model.callerContent.length > 20) highRiskSign();
  },
);
watch(
  () => model.title,
  () => {
    if (model.title && model.title.length >= 3) checkTitleRepetition();
  },
);

// ── 短信模板 ──
async function loadMessageTemplates() {
  try {
    const r = await http.get("/notice_sms_template/findByPurpose", {
      params: { purpose: "不予受理" },
    });
    if (r.data?.code === 200) {
      messageTemplateOptions.value = r.data.data || [];
      messageTemplateVisible.value = true;
    }
  } catch {
    ElMessage.warning("暂无可用模板");
  }
}
function selectMessageTemplate(t) {
  model.messageCode = t.code;
  model.messageName = t.name;
  model.messageContent = t.content;
  messageTemplateVisible.value = false;
}

// ── 通讯录 ──
function openMailList() {
  workbenchNav?.openCustomTab("mailList", "通讯录", "/dept/mailList", "通讯录");
}

// ── 播放录音/查看详情 ──
function ckDispose(row) {
  gdxqwin.value = true;
  orderInfoRef.value?.reloadDataByOrderId(row.orderId);
}
function playOrderSound() {
  const baseApi =
    window.common?.baseApi || window.__KXT_CONFIG__?.baseApi || "";
  audioUrlMaster.value = baseApi + model.haveSoundName;
  audioWinMaster.value = true;
}
function computeSecrecy(hs) {
  return model.isNameSecurity ? 0 : hs;
}

// ── 题词推送 ──
function tcts() {
  const data = {
    title: model.title,
    content: model.callerContent,
    name: model.name,
    callTel: model.callTel,
    addr: model.addr,
    orderOrigin: model.orderOrigin,
  };
  localStorage.setItem("kxt_tcts_data", JSON.stringify(data));
  ElMessage.success("已推送到题词");
}

// ── 直派模式 ──
async function directDispatch() {
  if (!model.title) {
    ElMessage.warning("请输入标题");
    return;
  }
  try {
    await ElMessageBox.confirm("确认直派吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    submitLoading.value = true;
    const r = await http.post(
      "/orderInfo/save",
      buildSubmitPayload({ isSubmit: "1", dispatchMode: "zp" }),
    );
    if (r.data?.code === 200) {
      ElMessage.success("直派成功");
      workbenchNav?.openMenuByCode("zcsw");
    } else ElMessage.error(r.data?.message || "操作失败");
  } catch {
  } finally {
    submitLoading.value = false;
  }
}

// ── 知识库申请 + 缺失登记 ──
const zsdApplyVisible = ref(false);
const zsdApplyForm = reactive({ title: "", content: "" });
async function applyKnowledge() {
  if (!zsdApplyForm.title) {
    ElMessage.warning("请输入标题");
    return;
  }
  try {
    const r = await http.post("/knowledgeBase/zsdApply", {
      title: zsdApplyForm.title,
      content: zsdApplyForm.content || model.callerContent,
    });
    if (r.data?.code === 200) {
      ElMessage.success("申请成功");
      zsdApplyVisible.value = false;
    } else ElMessage.error(r.data?.message || "申请失败");
  } catch {
    ElMessage.error("申请失败");
  }
}
const missingKlgVisible = ref(false);
const missingKlgForm = reactive({ title: "", reason: "" });
async function registerMissing() {
  if (!missingKlgForm.title) {
    ElMessage.warning("请输入缺失知识点标题");
    return;
  }
  try {
    const r = await http.post("/klKnowledgeDeletion/save", {
      title: missingKlgForm.title,
      reason: missingKlgForm.reason,
    });
    if (r.data?.code === 200) {
      ElMessage.success("登记成功");
      missingKlgVisible.value = false;
    } else ElMessage.error(r.data?.message || "登记失败");
  } catch {
    ElMessage.error("登记失败");
  }
}

// ── 通话记录标记 ──
async function markCallRecordHandled() {
  if (!model.callTel) return;
  try {
    await http.get("/incomeinfor/setCallRecordHandled", {
      params: { tel: model.callTel },
    });
  } catch { }
}
async function markRecordHandled() {
  if (!model.callTel) return;
  try {
    await http.get("/recordinfor/setRecordHandled", {
      params: { tel: model.callTel },
    });
  } catch { }
}

// ── 110工单检查 ──
const is110Checked = ref(false);
async function check110Order() {
  if (!model.callTel) return;
  try {
    const r = await http.get("/channelHandledOrderInfo/getHandledOrder110", {
      params: { tel: model.callTel },
    });
    if (r.data?.code === 200 && r.data.data) {
      is110Checked.value = true;
      ElMessage.warning("该号码在110平台有分派记录，请确认是否继续分派110平台");
    }
  } catch { }
}

// ── 标题重复检查 ──
async function checkTitleRepetition() {
  if (!model.title || model.title.length < 3) return;
  try {
    const r = await http.get("/knowledgeBase/titleRepetition", {
      params: { title: model.title },
    });
    if (r.data?.code === 200 && r.data.data) {
      ElMessage.warning("标题与已有知识点重复，请确认");
    }
  } catch { }
}

// ── 受理人分派 ──
const assignVisible = ref(false);
const assignUserId = ref("");
const assignUserList = ref([]);
async function openAssignDialog() {
  try {
    const r = await http.get("/dept/list/current_user", {
      params: { isUser: true },
    });
    if (r.data?.code === 200) assignUserList.value = r.data.data || [];
    assignVisible.value = true;
  } catch {
    ElMessage.warning("获取人员列表失败");
  }
}
async function doAssign() {
  if (!assignUserId.value) {
    ElMessage.warning("请选择受理人");
    return;
  }
  try {
    await http.post("/orderInfo/assign/personnel", {
      orderId: model.orderId || orderId.value,
      userId: assignUserId.value,
    });
    ElMessage.success("分派成功");
    assignVisible.value = false;
  } catch {
    ElMessage.error("分派失败");
  }
}

// ── 录音文件查询 ──
async function findSoundByOrderId() {
  if (!model.orderId && !orderId.value) return;
  try {
    const r = await http.post("/orderInfo/findSoundByOrderId", {
      orderId: model.orderId || orderId.value,
    });
    if (r.data?.code === 200 && r.data.data) {
      const d = r.data.data;
      model.haveSoundName = d.haveSoundName || "";
      model.haveSound = d.haveSound || 0;
      if (model.haveSoundName && model.haveSoundName !== "无") {
        const baseApi = window.common?.baseApi || "";
        audioUrlMaster.value = baseApi + model.haveSoundName;
        audioWinMaster.value = true;
      }
    }
  } catch { }
}

// 来电弹屏模式下自动标记通话记录
async function autoHandleCallRecords() {
  await markCallRecordHandled();
  await markRecordHandled();
}

// ── 初始化 ──
onMounted(async () => {
  await loadDicts();
  const mode = detectScreenPopMode();
  if (mode === "edit") await loadOrderData();
  if (mode === "telpop" || mode === "editTel") getlsgdList();
  getblxxList();
  searchOrigin();
  searchLost();
  loadRxList();
  if (!isEdit.value && !model.incidentTime)
    model.incidentTime = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  if (["telpop", "callRecord", "lostCall"].includes(mode))
    autoHandleCallRecords();
  if (mode === "lostCall" && model.callId) {
    http
      .get("/orderInfo/getOrderIdByCallId", {
        params: { callId: model.callId },
      })
      .then((r) => {
        if (r.data?.code === 200 && r.data.data) orderId.value = r.data.data;
      });
  }
  if (model.callTel) check110Order();
});
</script>

<template>
  <Container type="scroll">
    <div class="addOrder">
      <el-row class="order-layout" :gutter="12">
        <el-col class="main-col" :span="14">
          <div class="form-panel">
            <div v-if="audioWinMaster" style="margin: 8px">
              <Audio :the-url="audioUrlMaster" :call-i-d="audioCallId" @soundError="audioWinMaster = false" /><el-button
                 @click="audioWinMaster = false">关闭</el-button>
            </div>

            <!-- 市民信息 -->
            <div class="info-section citizen-section">
              <div class="section-head citizen-head">
                <div class="section-title">
                  <span>市民信息</span>
                  <span class="dial-title">市民拨打号码:</span>
                </div>
                <div class="section-actions">
                  <button class="expand-toggle" type="button" @click="qzbz = !qzbz">
                    <span>{{ qzbz ? "收起" : "展开" }}</span>
                    <span class="expand-arrow" :class="{ expanded: qzbz }"></span>
                  </button><el-button v-if="computeSecrecy(model.haveSound) === 1" type="primary" 
                    @click="playOrderSound">通话录音</el-button>
                </div>
              </div>
              <el-form label-width="90px" >
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="市民姓名"><el-input v-model="model.name" placeholder="请输入"
                        clearable /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="呼叫号码"><el-input v-model="model.callTel" placeholder="呼叫号码"
                        maxlength="12" show-word-limit clearable @keyup.enter="getlsgdList" /></el-form-item></el-col>
                  <el-col :span="8">
                    <div class="citizen-actions">
                      <el-button  @click="add0Click">{{ isTelAddZero ? "去0" : "加0" }}</el-button>
                      <el-button  @click="model.isNameSecurity = model.isNameSecurity ? 0 : 1">保密</el-button>
                      <el-button  @click="getlsgdList">查询</el-button>
                      <el-button  type="success" @click="hujiao(model.callTel)">呼叫</el-button>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz">
                  <el-col :span="8"><el-form-item label="性别"><el-select v-model="model.sex" placeholder="请选择性别"
                        clearable><el-option v-for="s in sexOptions" :key="s.value" :label="s.label"
                          :value="s.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="年龄"><el-select v-model="model.ageRange" clearable><el-option
                          v-for="a in ageRangeOptions" :key="a.value" :label="a.label"
                          :value="a.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="接收短信号码"><el-input v-model="model.shotMessageNumber"
                        maxlength="11" clearable /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz">
                  <el-col :span="8"><el-form-item label="标准普通话"><el-radio-group v-model="model.isBzpth"><el-radio
                          v-for="b in bzpthOptions" :key="b.value" :label="b.label"
                          :value="b.value" /></el-radio-group></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="人物画像"><el-select v-model="model.portrait" multiple
                        placeholder="最多3项" :multiple-limit="3"><el-option v-for="p in portraitOptions" :key="p.value"
                          :label="p.label" :value="p.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="本地人"><el-radio-group v-model="model.isNative"><el-radio
                          v-for="b in isNativeOptions" :key="b.value" :label="b.label"
                          :value="b.value" /></el-radio-group></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12" v-show="qzbz"><el-col :span="16"><el-form-item label="群众备注"><el-input
                        v-model="model.massesRemarks" clearable /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="身份证"><el-input v-model="model.idcard"
                        maxlength="18" clearable /></el-form-item></el-col></el-row>
                <el-row :gutter="12"><el-col :span="24"><el-form-item label="群众地址"><el-input v-model="model.addr"
                        clearable /></el-form-item></el-col></el-row>
              </el-form>
            </div>

            <!-- 受理单信息 -->
            <div class="info-section order-section">
              <div class="section-head order-head">
                <span>受理单信息</span>
                <div class="section-actions">
                  <el-button  @click="uploadFileWin = true">上传附件</el-button><el-button
                     @click="isShowFj = true">查看附件</el-button><el-button 
                    @click="getHotType">推荐热点</el-button><el-button  @click="getMindTitle">推荐标题</el-button>
                </div>
              </div>
              <el-form label-width="90px" >
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="服务渠道"><el-cascader v-model="model.orderOrigin"
                        :options="swlyOptions" :props="{
                          value: 'dictId',
                          label: 'dictName',
                          children: 'children',
                          expandTrigger: 'hover',
                        }" clearable filterable style="width: 100%" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="类型"><el-select v-model="model.orderType" clearable filterable
                        style="width: 100%"><el-option v-for="o in orderTypeOptions" :key="o.dictId" :label="o.dictName"
                          :value="o.dictId" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="群众情绪"><el-select v-model="model.emotion" clearable><el-option
                          v-for="e in emotionOptions" :key="e.value" :label="e.label"
                          :value="e.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="热点分类"><el-cascader v-model="model.hotspot1"
                        :options="hotspotOptions" :props="{
                          value: 'dictId',
                          label: 'dictName',
                          children: 'children',
                        }" placeholder="请选择" clearable filterable style="width: 100%"
                        @change="recommendedDept" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="诉求类型"><el-select v-model="model.orderTagName"><el-option
                          v-for="o in orderTagOptions" :key="o.value" :label="o.label"
                          :value="o.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="问题属地"><el-cascader v-model="model.deptId"
                        :options="wtsdOptions" :props="{
                          value: 'deptId',
                          label: 'deptName',
                          children: 'children',
                          expandTrigger: 'hover',
                          checkStrictly: true,
                        }" clearable filterable style="width: 100%" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="事发地址"><el-input v-model="model.orderAddr" placeholder="请输入事发地址"
                        clearable /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="专项工作"><el-select v-model="model.specialWork" clearable
                        filterable placeholder="请选择专项工作"><el-option v-for="s in specialWorkOptions" :key="s.dictId" :label="s.dictName"
                          :value="s.dictId" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="24"><el-form-item label="标题"><el-input v-model="model.title" placeholder="请输入标题"
                        maxlength="200" show-word-limit @change="searchOrigin" /></el-form-item></el-col>
                </el-row>
                <el-form-item class="caller-content-item"><template #label>
                    <div class="caller-content-label"><span>反映内容</span><el-button link type="primary" 
                        @click="intelligentExtraction">智能提取</el-button></div>
                  </template><el-input v-model="model.callerContent" type="textarea"
                    :autosize="{ minRows: 9, maxRows: 12 }" placeholder="请输入反映内容" maxlength="3000"
                    show-word-limit /></el-form-item>
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="保密信息"><el-input v-model="model.secrecyInfo"
                        clearable /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="事发时间"><el-date-picker v-model="model.incidentTime"
                        type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="24"><el-form-item label="备注"><el-input v-model="model.contentRemark"
                        clearable /></el-form-item></el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 办理信息 -->
            <div class="info-section handle-section">
              <div class="section-head"><span>办理信息</span></div>
              <el-form label-width="90px" >
                <el-row :gutter="12">
                  <el-col :span="24"><el-form-item label="办理方式"><el-radio-group v-model="model.handleType">
                        <el-radio v-for="h in handleTypeOptions.slice(0, 5)" :key="h.value" :value="h.value">{{ h.label
                          }}</el-radio>
                      </el-radio-group></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="级别"><el-select v-model="model.orderLevel" clearable
                        @change="changeOrderLevel"><el-option v-for="o in orderLevelOptions" :key="o.levelId"
                          :label="`${o.levelName} (${o.handleDays}日)`"
                          :value="o.levelId" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="办理时限"><el-date-picker v-model="model.handleEndTime"
                        type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%" /></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="单位电话"><el-input v-model="tel1"
                        clearable /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="承办单位">
                      <div v-if="recommendedDeptActive && groupOptions.length" style="margin-bottom: 4px">
                        <el-tag v-for="(g, gi) in groupOptions" :key="gi"  type="success"
                          style="cursor: pointer; margin: 2px" @click="selectRecommendedDept(g)">{{ g.deptName
                          }}</el-tag><el-button text  type="danger"
                          @click="recommendedDeptActive = false">关闭</el-button>
                      </div>
                      <SelectDeptOrUser ref="deptAndUserRef" v-model="model.handlerDeptId" :show-tabs="['dept']"
                        :is-filter="true" />
                    </el-form-item></el-col>
                  <el-col :span="16">
                    <div class="phone-actions">
                      <span>电话1:</span><el-input v-model="tel1" /><el-button  type="success"
                        @click="hujiao(tel1)">呼叫</el-button><el-button  type="danger"
                        @click="guaduan(tel1)">挂断</el-button><el-button 
                        @click="createThreeCall(tel1)">三方</el-button><el-button 
                        @click="restoreCall">恢复</el-button><el-button 
                        @click="blindTransferFn(tel1)">盲转</el-button>
                    </div>
                    <div v-if="tel2" style="
                        display: flex;
                        gap: 4px;
                        align-items: center;
                        margin-top: 4px;
                      ">
                      <span style="white-space: nowrap">电话2:</span><el-input v-model="tel2" 
                        style="width: 100px" /><el-button  type="success"
                        @click="hujiao(tel2)">呼叫</el-button>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="8"><el-form-item label="转接情况"><el-select v-model="model.transferInfo"
                        clearable><el-option v-for="t in transferInfoOptions" :key="t.value" :label="t.label"
                          :value="t.value" /></el-select></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="通讯录"><el-button @click="openMailList">通讯录</el-button></el-form-item></el-col>
                  <el-col :span="8"><el-form-item label="回访方式"><el-select v-model="model.hffs" clearable><el-option
                          v-for="h in hffsOptions" :key="h.value" :label="h.label"
                          :value="h.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item v-if="model.handleType === 3" label="短信模板"><el-input v-model="model.messageName"
                    readonly /><el-button  @click="loadMessageTemplates">选择模板</el-button><el-input
                    v-model="model.messageContent" style="margin-top: 4px" /></el-form-item>
                <el-form-item label="处理意见"><el-input v-model="model.acceptCenterIdea" type="textarea"
                    :autosize="{ minRows: 5, maxRows: 8 }" placeholder="请输入处理意见，最多输入3000字" maxlength="3000" show-word-limit /></el-form-item>
                <el-form-item v-if="model.handleType === 6" label="组长意见"><el-input v-model="model.groupLeaderOpinion"
                    type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" maxlength="500"
                    show-word-limit /></el-form-item>
                <el-form-item label="答复意见"><el-input v-model="model.releaseContent" type="textarea"
                    :autosize="{ minRows: 2, maxRows: 6 }" maxlength="500" show-word-limit /></el-form-item>
              </el-form>
            </div>

            <div class="form-actions">
              <el-checkbox v-model="sendMessage">群众短信</el-checkbox>
              <el-button @click="openMailList">通讯录</el-button>
              <el-button @click="tcts">题词推送</el-button>
              <el-button v-if="isEdit" @click="openAssignDialog">分派受理人</el-button>
              <el-button type="warning" @click="zsdApplyVisible = true">申请知识点</el-button>
              <el-button type="info" @click="missingKlgVisible = true">登记缺失</el-button>
              <el-button v-if="isEdit" @click="findSoundByOrderId">查录音</el-button>
              <el-button v-if="model.relevantOrderNode" @click="qxgl">取消关联: {{ model.relevantOrderNode }}</el-button>
              <el-tag v-if="is110Checked" type="danger" >110平台已分派</el-tag>
              <el-button type="primary" :loading="submitLoading" @click="directDispatch">直派</el-button>
              <el-button type="success" :loading="submitLoading" @click="handleSubmit(true)">继续受理</el-button>
              <el-button type="primary" :loading="submitLoading" @click="handleSubmit(false)">提交</el-button>
              <el-button @click="workbenchNav?.openMenuByCode('zcsw')">返回列表</el-button>
            </div>
          </div>
        </el-col>

        <!-- 右侧面板 -->
        <el-col class="side-col" :span="10">
          <div class="form-panel side-panel">
            <div class="panel-tabs">
              <button v-for="(tab, ti) in [
                '知识库信息',
                '办理信息',
                '历史受理单',
                '重复受理单',
                '失物受理单',
                '热线整合',
              ]" :key="ti" :class="{ active: activeClass === ti }" @click="activeClass = ti">
                {{ tab }}
              </button>
            </div>
            <div class="side-search">
              <el-input v-model="zskKeyword"  placeholder="可输入标题、电话、受理单编号" @keyup.enter="searchZsk" />
              <el-radio-group v-model="recommendedDeptActive">
                <el-radio :value="true">查看自己</el-radio>
                <el-radio :value="false">查看所有</el-radio>
              </el-radio-group>
              <el-button type="primary"  @click="searchZsk">搜索</el-button>
            </div>
            <div v-show="activeClass === 0" style="padding: 10px">
              <el-table :data="zskList"  border max-height="400"><el-table-column type="index"
                  width="90" label="编号" /><el-table-column prop="title" label="标题" min-width="150"
                  show-overflow-tooltip /><el-table-column prop="content" label="内容" min-width="160"
                  show-overflow-tooltip /><el-table-column prop="createUserName" label="登记人员"
                  width="90" /><el-table-column prop="statusName" label="状态"
                  width="80" /><el-table-column label="操作" width="90"><template #default="{ row }"><el-button
                      link type="primary" 
                      @click="zskViewDetail(row)">查看</el-button></template></el-table-column></el-table>
              <el-pagination small background layout="total, prev, next" :total="zskPageInfo.total"
                :page-size="zskPageInfo.pageSize" style="margin-top: 6px; justify-content: flex-end" />
            </div>
            <div v-show="activeClass === 1" style="padding: 10px">
              <el-table :data="blxxList"  border max-height="400"><el-table-column type="index"
                  width="40" /><el-table-column prop="orderNo" label="编号" width="160"
                  show-overflow-tooltip /><el-table-column prop="title" label="标题" min-width="120"
                  show-overflow-tooltip /></el-table>
            </div>
            <div v-show="activeClass === 2" style="padding: 10px">
              <el-table :data="lsgdList"  border max-height="400"><el-table-column type="index"
                  width="40" /><el-table-column prop="orderNo" label="编号" width="160"
                  show-overflow-tooltip /><el-table-column prop="title" label="标题" min-width="120"
                  show-overflow-tooltip /><el-table-column label="时间" width="140"><template #default="{ row }">{{
                    fmtT(row.createTime)
                    }}</template></el-table-column><el-table-column label="操作" width="120"><template
                    #default="{ row }"><el-button link type="primary" 
                      @click="ckDispose(row)">查看</el-button><el-button link type="warning" 
                      @click="cbClick(row)">催办</el-button></template></el-table-column></el-table>
            </div>
            <div v-show="activeClass === 3" style="padding: 10px">
              <div style="display: flex; gap: 6px; margin-bottom: 8px">
                <el-date-picker v-model="xggdParams.startTime" type="date" value-format="YYYY-MM-DD" placeholder="开始"
                   /><el-date-picker v-model="xggdParams.endTime" type="date" value-format="YYYY-MM-DD"
                  placeholder="结束"  /><el-button  type="primary"
                  @click="searchOrigin">检索</el-button>
              </div>
              <el-table :data="xggdList"  border max-height="350"><el-table-column type="index"
                  width="40" /><el-table-column prop="orderNo" label="编号" width="160"
                  show-overflow-tooltip /><el-table-column prop="title" label="标题" min-width="140"
                  show-overflow-tooltip /><el-table-column label="关联"><template #default="{ row }"><el-button link
                      type="primary"  :disabled="setGlDisabled(row)"
                      @click="glRow(row)">关联</el-button></template></el-table-column></el-table>
            </div>
            <div v-show="activeClass === 4" style="padding: 10px">
              <el-table :data="lostgdList"  border max-height="400"><el-table-column type="index"
                  width="40" /><el-table-column prop="orderNo" label="编号" width="160"
                  show-overflow-tooltip /><el-table-column prop="title" label="标题" min-width="140"
                  show-overflow-tooltip /><el-table-column label="关联"><template #default="{ row }"><el-button link
                      type="primary" 
                      @click="glRow(row)">关联</el-button></template></el-table-column></el-table>
            </div>
            <div v-show="activeClass === 5" style="padding: 10px">
              <el-tag v-for="(rx, rxi) in rxList" :key="rxi"  style="margin: 3px; cursor: pointer"
                @click="hujiao(rx)">{{ rx }}</el-tag><el-empty v-if="!rxList.length" description="暂无热线数据"
                :image-size="40" />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <Orderinfo ref="orderInfoRef" />
    <!-- 催办 -->
    <el-dialog v-model="cbFormVisible" title="催办" width="420px" append-to-body><el-form ><el-form-item
          label="催办意见"><el-input v-model="cbModel.urgeContent" type="textarea"
            :autosize="{ minRows: 3 }" /></el-form-item></el-form><el-checkbox
        v-model="cbModel.isSendMessage">发送短信</el-checkbox><template #footer><el-button
          @click="cbFormVisible = false">取消</el-button><el-button type="primary"
          @click="cbSubmit">确定</el-button></template></el-dialog>
    <!-- 知识点 -->
    <el-dialog v-model="zsdDetailVisible" title="知识点详情" width="600px" append-to-body>
      <div>
        <h3>{{ zsdDetail.title }}</h3>
        <div v-html="zsdDetail.content || zsdDetail.htmlContent" style="max-height: 400px; overflow: auto" />
      </div>
      <template #footer><el-button @click="zsdDetailVisible = false">关闭</el-button><el-button type="primary"
          @click="useKnowledge">使用此知识点</el-button></template>
    </el-dialog>
    <!-- 上传 -->
    <el-dialog v-model="uploadFileWin" title="上传附件" width="500px" append-to-body><el-upload drag :action="uploadAction"
        :headers="uploadHeaders" :before-upload="beforeUpload" :on-success="handleUploadSuccess" multiple><el-icon
          class="el-icon--upload" :size="40"><svg viewBox="0 0 1024 1024" width="40" height="40">
            <path
              d="M544 864V672h128L512 480 352 672h128v192H320v-1.6c-5.376 0.32-10.496 1.6-16 1.6-61.76 0-117.248-27.264-153.6-71.04A192 192 0 0 1 96 640c0-106.048 85.952-192 192-192 14.336 0 28.16 2.048 41.6 5.376C360.064 318.528 430.4 224 544 224c121.984 0 220.864 82.944 220.864 185.6 85.376 16.576 160.96 85.248 160.96 166.4 0 91.392-85.312 164.48-188.224 164.48H544z"
              fill="#ccc" />
          </svg></el-icon>
        <div class="el-upload__text">
          拖拽文件或<em>点击上传</em>
        </div>
      </el-upload><template #footer><el-button @click="uploadFileWin = false">关闭</el-button></template></el-dialog>
    <!-- 附件 -->
    <el-dialog v-model="isShowFj" title="附件列表" width="600px" append-to-body @opened="loadFjList">
      <ul v-if="fjList.length" class="fj-list">
        <li v-for="(fj, fi) in fjList" :key="fi">
          <a :href="fj.filePath || fj.url" target="_blank">{{
            fj.fileName || "附件" + (fi + 1)
            }}</a>
        </li>
      </ul>
      <el-empty v-else description="暂无附件" :image-size="48" /><template #footer><el-button
          @click="isShowFj = false">关闭</el-button></template>
    </el-dialog>
    <!-- 短信模板 -->
    <el-dialog v-model="messageTemplateVisible" title="短信模板" width="500px" append-to-body><el-table
        :data="messageTemplateOptions"  border max-height="400"><el-table-column prop="name"
          label="模板名称" /><el-table-column prop="content" label="内容" show-overflow-tooltip /><el-table-column label="操作"
          width="60"><template #default="{ row }"><el-button link type="primary"
              @click="selectMessageTemplate(row)">选择</el-button></template></el-table-column></el-table><template
        #footer><el-button @click="messageTemplateVisible = false">关闭</el-button></template></el-dialog>
    <!-- 申请知识点 -->
    <el-dialog v-model="zsdApplyVisible" title="申请知识点" width="500px" append-to-body><el-form 
        label-width="80px"><el-form-item label="标题"><el-input
            v-model="zsdApplyForm.title" /></el-form-item><el-form-item label="内容"><el-input
            v-model="zsdApplyForm.content" type="textarea"
            :autosize="{ minRows: 3 }" /></el-form-item></el-form><template #footer><el-button
          @click="zsdApplyVisible = false">取消</el-button><el-button type="primary"
          @click="applyKnowledge">申请</el-button></template></el-dialog>
    <!-- 登记缺失知识点 -->
    <el-dialog v-model="missingKlgVisible" title="登记缺失知识点" width="500px" append-to-body><el-form 
        label-width="80px"><el-form-item label="标题"><el-input
            v-model="missingKlgForm.title" /></el-form-item><el-form-item label="原因"><el-input
            v-model="missingKlgForm.reason" type="textarea"
            :autosize="{ minRows: 2 }" /></el-form-item></el-form><template #footer><el-button
          @click="missingKlgVisible = false">取消</el-button><el-button type="primary"
          @click="registerMissing">登记</el-button></template></el-dialog>
    <!-- 受理人分派 -->
    <el-dialog v-model="assignVisible" title="分派受理人" width="450px" append-to-body><el-form ><el-form-item
          label="受理人"><el-select v-model="assignUserId" filterable placeholder="选择受理人" style="width: 100%"><el-option
              v-for="u in assignUserList" :key="u.userId || u.id" :label="u.userName || u.label"
              :value="u.userId || u.id" /></el-select></el-form-item></el-form><template #footer><el-button
          @click="assignVisible = false">取消</el-button><el-button type="primary"
          @click="doAssign">确认分派</el-button></template></el-dialog>
  </Container>
</template>

<style scoped lang="scss">
$page: #eef5f9;
$panel: #ffffff;
$line: #d8e5f0;
$line-soft: #e8f0f7;
$section-bg: #eef6ff;
$control: #f9fcff;
$text: #23364a;
$muted: #7b8ea2;
$primary: #1f74d8;
$primary-dark: #07549b;
$green: #42c638;
$orange: #e99a22;
$red: #f45b63;
$shadow: 0 10px 30px rgba(26, 65, 99, 0.08);

.addOrder {
  min-height: 900px;
  padding: 10px 4px 18px;
  color: $text;
  background:
    linear-gradient(90deg, rgba(23, 103, 185, 0.035) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(0deg, rgba(23, 103, 185, 0.03) 1px, transparent 1px) 0 0 / 48px 48px,
    $page;
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;
  font-size: 14px;
}

.order-layout {
  display: grid;
  grid-template-columns: minmax(760px, 58%) minmax(560px, 42%);
  gap: 6px;
  align-items: flex-start;
}

.order-layout>.main-col,
.order-layout>.side-col {
  max-width: none;
  width: auto;
  flex: initial;
}

.form-panel {
  overflow: hidden;
  border: 1px solid $line;
  border-radius: 0;
  background: $panel;
  box-shadow: none;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 37px;
  padding: 0 12px;
  border-bottom: 1px solid $line;
  background: linear-gradient(#f6fbff, #ecf5ff);
  color: #0f4f93;
  font-size: 14px;
  font-weight: 700;
}

.info-section {
  border-bottom: 1px solid $line;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 37px;
  padding: 0 12px;
  border-bottom: 1px solid $line;
  background: $section-bg;
  color: #1c3450;
  font-size: 14px;
  font-weight: 700;
}

.section-head span {
  margin-right: 0;
}

.section-title,
.section-actions {
  display: flex;
  align-items: center;
}

.section-title {
  gap: 32px;
}

.section-actions {
  gap: 10px;
}

.expand-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 37px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: #1f2d3d;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 37px;
  cursor: pointer;
}

.expand-toggle:hover {
  color: #0f4f93;
}

.expand-arrow {
  width: 7px;
  height: 7px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  transition: transform 0.15s ease;
}

.expand-arrow.expanded {
  transform: rotate(225deg) translateY(-1px);
}

.dial-title {
  color: #1c3450;
  font-weight: 700;
}

.section-head :deep(.el-button.is-text) {
  color: $primary;
  font-weight: 500;
}

.citizen-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  height: 37px;
  padding: 0 10px;
  border-right: 1px solid $line;
  border-bottom: 1px solid $line;
  background: $control;
}

.citizen-actions :deep(.el-button--small) {
  height: 28px;
  min-width: 54px;
  margin: 0;
  border-radius: 2px;
  border-color: #cfddeb;
  padding: 0 12px;
  background: linear-gradient(#fff, #f5f8fb);
  color: #243a50;
  font-size: 14px;
}

.citizen-actions :deep(.el-button--success) {
  color: #fff;
  border-color: $green;
  background: $green;
}

.side-panel {
  min-height: calc(100vh - 32px);
}

.panel-tabs {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  height: 46px;
  padding: 0 0 0 0;
  border-bottom: 1px solid #c9dcf1;
  background: #fff;
}

.panel-tabs button {
  position: relative;
  min-width: 0;
  height: 45px;
  padding: 0 8px;
  border: 0;
  border-right: 1px solid $line;
  border-bottom: 1px solid $line;
  border-radius: 0;
  background: linear-gradient(180deg, #fafdff 0%, #f1f8ff 100%);
  color: #2868b7;
  font-size: 14px;
  font-weight: 600;
  line-height: 45px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.panel-tabs button::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 10px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: transparent;
  content: "";
}

.panel-tabs button.active {
  border-color: $line;
  background: #eef6ff;
  color: #0b60c7;
  font-weight: 700;
  box-shadow: none;
}

.panel-tabs button.active::after {
  background: linear-gradient(90deg, $primary, #48a5ff);
}

.side-search {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid $line;
  background: #fff;
}

.side-search :deep(.el-input) {
  width: 260px;
  flex: 0 0 260px;
}

.side-search :deep(.el-button) {
  min-width: 66px;
}

.form-actions {
  position: static;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 56px;
  padding: 8px 12px;
  border-top: 1px solid $line;
  background: #f8fbfe;
  box-shadow: none;
}

.fj-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.fj-list a {
  color: $primary-dark;
  font-size: 13px;
}

:deep(.addOrder .el-form) {
  width: 100%;
}

:deep(.addOrder .el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

:deep(.addOrder .el-col) {
  padding-right: 0 !important;
  padding-left: 0 !important;
}

:deep(.addOrder .order-layout > .el-col) {
  padding-right: 0 !important;
  padding-left: 0 !important;
}

:deep(.info-section .el-form-item) {
  min-height: 37px;
  margin: 0;
  border-right: 1px solid $line;
  border-bottom: 1px solid $line;
  background: #fff;
}

:deep(.info-section .el-row:last-child .el-form-item) {
  border-bottom: 0;
}

:deep(.info-section .el-form-item__label) {
  width: var(--order-label-width, 12.3%) !important;
  flex: 0 0 var(--order-label-width, 12.3%);
  min-height: 37px;
  padding: 0;
  border-right: 1px solid $line-soft;
  background: #fbfdff;
  color: #3d4d5d;
  font-size: 14px;
  line-height: 37px;
  justify-content: center;
  white-space: nowrap;
}

:deep(.info-section .el-col-8 .el-form-item) {
  --order-label-width: 37%;
}

:deep(.info-section .el-col-12 .el-form-item) {
  --order-label-width: 24.6%;
}

:deep(.info-section .el-col-16 .el-form-item) {
  --order-label-width: 18.5%;
}

:deep(.info-section .el-col-24 .el-form-item),
:deep(.info-section > .el-form > .el-form-item) {
  --order-label-width: 12.3%;
}

:deep(.info-section .el-form-item__content) {
  min-width: 0;
  min-height: 37px;
  padding: 0;
  line-height: 37px;
  background: $control;
}

:deep(.info-section .el-input),
:deep(.info-section .el-select),
:deep(.info-section .el-cascader),
:deep(.info-section .el-date-editor.el-input) {
  width: 100%;
  height: 37px;
}

:deep(.info-section .el-input__wrapper),
:deep(.info-section .el-select__wrapper),
:deep(.info-section .el-cascader .el-input__wrapper),
:deep(.info-section .el-textarea__inner) {
  height: 100%;
  border-radius: 0;
  background: $control;
  box-shadow: none;
}

:deep(.info-section .el-input__wrapper:hover),
:deep(.info-section .el-select__wrapper:hover),
:deep(.info-section .el-cascader .el-input__wrapper:hover),
:deep(.info-section .el-textarea__inner:hover) {
  box-shadow: inset 0 0 0 1px #c5d7e8;
}

:deep(.info-section .el-input__wrapper.is-focus),
:deep(.info-section .el-select__wrapper.is-focused),
:deep(.info-section .el-cascader .el-input__wrapper.is-focus),
:deep(.info-section .el-textarea__inner:focus) {
  box-shadow: inset 0 0 0 1px $primary;
}

:deep(.info-section .el-input__inner),
:deep(.info-section .el-select__placeholder),
:deep(.info-section .el-date-editor .el-input__inner) {
  height: 37px;
  line-height: 37px;
  color: $text;
  font-size: 14px;
}

:deep(.info-section .el-input__wrapper) {
  padding: 0 10px;
}

:deep(.info-section .el-input__count) {
  right: 8px;
  color: $muted;
  background: transparent;
}

:deep(.info-section .el-button--small) {
  height: 28px;
  min-width: 54px;
  padding: 0 12px;
  border-radius: 2px;
  border-color: #cfddeb;
  background: linear-gradient(#fff, #f5f8fb);
  color: #243a50;
  font-size: 14px;
}

:deep(.info-section .el-form-item__content > .el-button) {
  margin-left: 6px;
}

:deep(.citizen-section .el-form-item__content) {
  flex-wrap: nowrap;
}

:deep(.citizen-section .el-form-item__content > .el-input) {
  min-width: 0;
  flex: 1 1 auto;
}

:deep(.citizen-section .el-form-item__content > .el-button) {
  flex: 0 0 auto;
  min-width: 48px;
  padding: 0 10px;
}

:deep(.order-section .el-textarea__inner) {
  min-height: 260px !important;
  padding: 9px 10px;
  color: $text;
  font-size: 14px;
  line-height: 24px;
}

:deep(.order-section .caller-content-item) {
  min-height: 260px;
}

:deep(.order-section .caller-content-item .el-form-item__label) {
  min-height: 260px;
  line-height: normal;
}

:deep(.order-section .caller-content-item .el-form-item__content) {
  min-height: 260px;
  line-height: normal;
}

:deep(.caller-content-label) {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 260px;
  align-items: center;
  justify-content: center;
}

:deep(.caller-content-label .el-button) {
  position: absolute;
  top: 145px;
  left: 50%;
  height: 22px;
  padding: 0;
  transform: translateX(-50%);
  font-size: 14px;
}

:deep(.handle-section .el-textarea__inner) {
  height: auto !important;
  min-height: 160px !important;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 24px;
}

.main-col>.form-panel {
  min-height: calc(100vh - 32px);
}

.phone-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 37px;
  padding: 0 10px;
  border-right: 1px solid $line;
  border-bottom: 1px solid $line;
  background: $control;
}

.phone-actions span {
  flex: 0 0 auto;
  color: #1c3450;
}

.phone-actions :deep(.el-input) {
  width: 110px;
  flex: 0 0 110px;
}

:deep(.side-panel > div[style*="padding:10px"]) {
  padding: 8px !important;
}

:deep(.side-panel > div[style*="padding:10px"]:first-of-type) {
  border-bottom: 1px solid $line;
}

:deep(.side-panel > div[style*="padding:10px"] > div[style*="display:flex"]) {
  display: grid !important;
  grid-template-columns: 1fr 62px;
  gap: 6px !important;
  margin-bottom: 8px !important;
}

:deep(.side-panel .el-table) {
  --el-table-border-color: #d8e5f0;
  --el-table-header-bg-color: #eef6ff;
  margin: 0;
  color: $text;
  font-size: 14px;
}

:deep(.side-panel .el-table th.el-table__cell) {
  height: 37px;
  color: #22394f;
  font-weight: 700;
}

:deep(.side-panel .el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.side-panel .el-table__empty-block) {
  min-height: 66px;
  color: #6b7f94;
}

:deep(.side-panel .el-pagination) {
  height: 32px;
  margin-top: 0;
  justify-content: flex-end;
  color: #4e6378;
}

:deep(.side-panel .el-input__wrapper),
:deep(.side-panel .el-date-editor.el-input__wrapper) {
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px #cfddeb;
}

:deep(.side-panel .el-button--primary) {
  border-color: $primary;
  background: $primary;
}

:deep(.el-button--success) {
  border-color: $green;
  background: $green;
}

:deep(.el-button--warning) {
  border-color: $orange;
  background: $orange;
}

:deep(.el-button--danger) {
  border-color: $red;
  background: $red;
}

:deep(.el-button--primary) {
  border-color: $primary;
  background: $primary;
}

:deep(.el-button--info) {
  border-color: #7c8490;
  background: #7c8490;
}

:deep(.form-actions .el-button) {
  height: 28px;
  min-width: 54px;
  border-radius: 2px;
  border-color: #cfddeb;
  padding: 0 12px;
  color: #243a50;
  background: linear-gradient(#fff, #f5f8fb);
  font-size: 14px;
}

:deep(.form-actions .el-button--warning) {
  color: #fff;
  border-color: $orange;
  background: $orange;
}

:deep(.form-actions .el-button--success) {
  color: #fff;
  border-color: $green;
  background: $green;
}

:deep(.form-actions .el-button--primary) {
  color: #fff;
  border-color: $primary-dark;
  background: $primary-dark;
}

:deep(.form-actions .el-button--info) {
  color: #fff;
  border-color: #7c8490;
  background: #7c8490;
}

:deep(.form-actions .el-checkbox) {
  margin-right: 4px;
  color: #445c74;
}

@media (max-width: 1500px) {
  .order-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    margin-top: 12px;
  }
}
</style>
