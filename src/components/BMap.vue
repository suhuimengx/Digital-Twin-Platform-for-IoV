<template class="dark">
    <div class="common-layout">
        
        <el-container class="maincontent">
            <!-- 标题 -->
            <div class="page-title" v-if="IsShow">
            <text class="title-text" >智慧校园数字孪生平台</text>
            </div>
            <!-- 左侧事件信息部分 -->
            <div class="message-container"> 
                    <div class="card-header">
                        <text style="text-align: left;font-size: medium;color: #32C5FF">事件信息</text>
                    </div>
                    <div class="car-tag">
                        <el-tag size="small">car1</el-tag>
                        <el-tag type="success" size="small">car2</el-tag>
                        <el-tag type="info" size="small">car3</el-tag>
                    </div>
                    <div class="timeline-container">
                        <el-timeline class="timeline">
                            <el-timeline-item v-for="(activity, index) in activities1" :key="index"
                                :timestamp="activity.timestamp">
                                {{ activity.content }}</el-timeline-item>
                        </el-timeline>
                        <el-timeline class="timeline">
                            <el-timeline-item v-for="(activity, index) in activities2" :key="index"
                                :timestamp="activity.timestamp">
                                {{ activity.content }}</el-timeline-item>
                        </el-timeline>
                        <el-timeline class="timeline">
                            <el-timeline-item v-for="(activity, index) in activities3" :key="index"
                                :timestamp="activity.timestamp">
                                {{ activity.content }}</el-timeline-item>
                        </el-timeline>
                    </div>
            </div>
            <!-- 司乘共显视角 -->
            <div class="gdmap-container">
                <div class="card-header">
                        <text style="text-align: left;font-size: medium;color: #32C5FF">司乘共显视角</text>
                </div>
                <div id="gdmap" style="width: 100%;height: 30vh;position: relative;"></div>
                <div class="test-button">
                    <button @click="SocketConnect">connect</button>
                    <button @click="test">connect</button>
                    <button @click="SocketDisconnect">disconnect</button>
                    <!-- <button @click="open1">插入1</button> -->
                    <!-- <button @click="insert2">插入2</button> -->
                </div>
            </div>
            <!-- 右侧车辆状态部分 -->
            <div class="box-card">
                <div class="v-card">
                    <div>
                        <div class="card-header">
                        <text style="text-align: left;font-size: medium;color: #32C5FF">智慧园区车辆状态</text>
                        </div>
                    </div>
                    <v-card-text style="width: 100%;">
                        <table class="custom-table" style="width: 100%;">
                            <thead>
                            <tr>
                                <th style="color: #19ECFF;">车辆编号</th>
                                <th style="color: #19ECFF;">载客量</th>
                                <th style="color: #19ECFF;">行驶里程/m</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="item in car_status" :key="item.car_id">
                                <td style="color: #FFC814;">{{ item.car_id }}</td>
                                <td style="color: chartreuse;">{{ item.PassengerNum }}</td>
                                <td style="color: #FC8900;">{{ item.TravlledDistance }}</td>
                            </tr>
                            </tbody>
                        </table>
                        <div class="chart">
                        <v-chart :option="option" autoresize />
                        </div>
                    </v-card-text>

                </div>
            </div>
            <!-- 主体地图部分 底层 -->
            <el-container style="padding-top: 0%;height: 100vh">
                <el-main style="width: 100%;height: 100%;padding: 0%;margin: 0%">
                    <div id="allmap" style="width: 100%;height: 100%;position: relative;"></div>
                </el-main>
                <!-- 底部时间轴 -->
                <el-footer style="padding: 0%;margin: 0%">
                    <el-progress :percentage="percentage" :stroke-width="12" striped striped-flow>
                        <span>{{ real_time }}</span>
                    </el-progress>
                    <!--
                    <el-button class="toggle-button" @click="toggleVisibility">
                        {{ isHidden ? '显示所有内容' : '隐藏所有内容' }}
                    </el-button>
                    -->
                </el-footer>
            </el-container>
            <!--根据showrealdemand的真假选择性渲染-->
            <div class="messagepop" v-if="showrealdemand">{{ real_time_demand }}</div>


        </el-container>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { RodeArray, PointSets, MarkerSets, LabelSets } from "../points.js"
import { getPoints, GetSteps, DriveCar, ComputeRotation, MoveMapCenter } from "../tools.js"
import { ElNotification, ElMessage } from 'element-plus'
import axios from 'axios'
import styleJson from '/src/assets/map_style3.json'
import io from 'socket.io-client'

//引入echarts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { color } from 'echarts'
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);
const real_time_demand = ref("")
const showrealdemand = ref(false)
const passenger_num=ref(0)
const no_passenger_num = ref(21)//总容量为21人

//饼状图的配置参数
const option = ref({
  title: {
    text: '共乘情况',
    left: '5%',
    textStyle: {
        color: '#03E3EE'
    }
  },
  color:['#03E3EE', '#DAAC15', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  legend: {
    orient: 'vertical',
    left: 'left',
    top:'middle',
    data: ['载客人数', '空载人数'],
    textStyle:{
        color:'#03E3EE'
    }
  },
  series: [
    {
      name: '共乘情况',
      type: 'pie',
      radius: '55%',
      center: ['60%', '50%'],
      data: [
        { value: passenger_num, name: '载客人数' },
        { value: no_passenger_num, name: '空载人数' },

      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
});


const percentage = ref(0)
const real_time = ref("7:20:00")
var huawei_token = ""

var socket = null
var map = null
var gdmap = null
var marker_gd = null
var passedPolyline = null
var MarkerCar_01 = null
var MarkerCar_02 = null
var MarkerCar_03 = null
var insert1_flag = true
var insert2_flag = true


const IsShow = ref(true)

const SocketDisconnect = () => {
    if (socket) {
        socket.disconnect()
    }
    console.log('websocket disconnected...')
}

const activities1 = ref([
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
])
const activities2 = ref([
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
])
const activities3 = ref([
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
    { content: '...\n...', timestamp: '7:20:00', },
])
const car_status = ref([
    { car_id: "car_01", PassengerNum: 0, TravlledDistance: 0 },
    { car_id: "car_02", PassengerNum: 0, TravlledDistance: 0 },
    { car_id: "car_03", PassengerNum: 0, TravlledDistance: 0 },
])

const toggleVisibility = () => {
    IsShow.value = !IsShow.value;
}

const test = () => {
    let message1 = `一个实时订单被分配给了aaa号小车`
    real_time_demand.value = message1;
    showrealdemand.value = true;
    setTimeout(() => {
            showrealdemand.value = false;
        }, 4000)
    passenger_num.value= 0.01
    no_passenger_num.value = 21 - passenger_num.value
}

const SocketConnect = () => {
    socket = io("http://localhost:5000/")
    socket.on('connect', () => {
        console.log('websocket connected...')
    })
    socket.on('send_message_carLoad', (res) => {
        var carId = res.car_id
        if (carId == 1) {
            //更新园区状态表
            car_status.value[1 - 1].PassengerNum = res.PassengerNum
            if (res.various_num != 0) {
                //更新时间轴窗口
                let text = null
                if (res.type == "get_out_car")
                    text = `下车${-res.various_num}位乘客`
                else
                    text = `上车${res.various_num}位乘客`
                let temp_activity = []
                temp_activity.push(activities1.value[1])
                temp_activity.push(activities1.value[2])
                temp_activity.push(activities1.value[3])
                temp_activity.push({ content: text, timestamp: res.time_stamp })
                activities1.value = temp_activity
                //标注车辆图标事件
                let temp_label = new BMapGL.Label("1号车辆: " + text)
                temp_label.setStyle({
                    color: '#000',
                    fontSize: '20px',
                    border: '2px solid #1E90FF'
                })
                if (MarkerCar_01.getLabel())
                    MarkerCar_01.getLabel().remove()
                MarkerCar_01.setLabel(temp_label)
                setTimeout(() => {
                    if (MarkerCar_01.getLabel())
                        MarkerCar_01.getLabel().remove()
                }, 500);
            }
        
        }
        else if (carId == 2) {
            //更新园区状态表
            car_status.value[2 - 1].PassengerNum = res.PassengerNum
            if (res.various_num != 0) {
                //更新时间轴窗口
                let text = null
                if (res.type == "get_out_car")
                    text = `下车${-res.various_num}位乘客`
                else
                    text = `上车${res.various_num}位乘客`
                let temp_activity = []
                temp_activity.push(activities2.value[1])
                temp_activity.push(activities2.value[2])
                temp_activity.push(activities2.value[3])
                temp_activity.push({ content: text, timestamp: res.time_stamp })
                activities2.value = temp_activity
                //标注车辆图标事件
                let temp_label = new BMapGL.Label("2号车辆: " + text)
                temp_label.setStyle({
                    color: '#000',
                    fontSize: '20px',
                    border: '2px solid #1E90FF'
                })
                if (MarkerCar_02.getLabel())
                    MarkerCar_02.getLabel().remove()
                MarkerCar_02.setLabel(temp_label)
                setTimeout(() => {
                    if (MarkerCar_02.getLabel())
                        MarkerCar_02.getLabel().remove()
                }, 500);
            }

        }
        else {
            //更新园区状态表
            car_status.value[3 - 1].PassengerNum = res.PassengerNum
            if (res.various_num != 0) {
                //更新时间轴窗口
                let text = null
                if (res.type == "get_out_car")
                    text = `下车${-res.various_num}位乘客`
                else
                    text = `上车${res.various_num}位乘客`
                let temp_activity = []
                temp_activity.push(activities3.value[1])
                temp_activity.push(activities3.value[2])
                temp_activity.push(activities3.value[3])
                temp_activity.push({ content: text, timestamp: res.time_stamp })
                activities3.value = temp_activity
                //标注车辆图标事件
                let temp_label = new BMapGL.Label("3号车辆: " + text)
                temp_label.setStyle({
                    color: '#000',
                    fontSize: '20px',
                    border: '2px solid #1E90FF'
                })
                if (MarkerCar_03.getLabel())
                    MarkerCar_03.getLabel().remove()
                MarkerCar_03.setLabel(temp_label)
                setTimeout(() => {
                    if (MarkerCar_03.getLabel())
                        MarkerCar_03.getLabel().remove()
                }, 500);
            }
        }
        passenger_num.value = car_status.value[0].PassengerNum + car_status.value[1].PassengerNum + car_status.value[2].PassengerNum
        no_passenger_num.value = 21 - passenger_num.value
    })
    //定时捕获地图中心位置
    setInterval(() => {
        let mapCenter = MoveMapCenter(MarkerCar_01, MarkerCar_02, MarkerCar_03)
        map.setCenter(mapCenter)
    }, 3500);
    //用于展示单车运行视角 && 实现乘客上下车效果
    socket.on('send_message', (res) => {
        var temp_array = res.location_array
        var temp_array_gd = res.location_array_amap
        var carId = res.car_id
        var waitTime = (temp_array_gd.length / 2 * 500) | 0
        var deta_distance = res.distance / (temp_array_gd.length + 1)
        console.log(res)
        if (carId == 1) {
            //展示单车运行视角
            var duration_gd = 500//每一小段路程耗时
            //高德地图的小车移动
            marker_gd.moveAlong(temp_array_gd, {
                //每一段的时长
                duration: duration_gd,
                autoRotation: true,
            })
            car_status.value[1 - 1].PassengerNum = res.PassengerNum//更新本小车的载客量

            //实时估算更新车辆已行驶里程
            var distance_cnt = 0
            var Distance_Timer = setInterval(() => {
                if (distance_cnt < temp_array_gd.length) {
                    car_status.value[1 - 1].TravlledDistance += deta_distance//本段路径没结束，就按照设置的速度增加路程，实际与小车运动并无关系，二者通过定时器保持接近同步
                    car_status.value[1 - 1].TravlledDistance |= 0
                    distance_cnt++
                }
                if (distance_cnt >= temp_array_gd.length) {
                    clearInterval(Distance_Timer)
                }
            }, 500);
            //更新多车大地图图标位置
            //百度地图
            MarkerCar_01.setPosition(new BMapGL.Point(temp_array[0][0], temp_array[0][1]))
        }
        else if (carId == 2) {
            car_status.value[2 - 1].PassengerNum = res.PassengerNum
            //实时估算更新车辆已行驶里程
            var distance_cnt = 0
            var Distance_Timer = setInterval(() => {
                if (distance_cnt < temp_array_gd.length) {
                    car_status.value[2 - 1].TravlledDistance += deta_distance
                    car_status.value[2 - 1].TravlledDistance |= 0
                    distance_cnt++
                }
                if (distance_cnt >= temp_array_gd.length) {
                    clearInterval(Distance_Timer)
                }
            }, 500);
            //更新多车大地图图标位置
            MarkerCar_02.setPosition(new BMapGL.Point(temp_array[0][0], temp_array[0][1]))
        }
        else {
            car_status.value[3 - 1].PassengerNum = res.PassengerNum
            //实时估算更新车辆已行驶里程  
            var distance_cnt = 0
            var Distance_Timer = setInterval(() => {
                if (distance_cnt < temp_array_gd.length) {
                    car_status.value[3 - 1].TravlledDistance += deta_distance
                    car_status.value[3 - 1].TravlledDistance |= 0
                    distance_cnt++
                }
                if (distance_cnt >= temp_array_gd.length) {
                    clearInterval(Distance_Timer)
                }
            }, 500);
            //更新多车大地图图标位置
            MarkerCar_03.setPosition(new BMapGL.Point(temp_array[0][0], temp_array[0][1]))
        }
        passenger_num.value = car_status.value[0].PassengerNum + car_status.value[1].PassengerNum + car_status.value[2].PassengerNum
        no_passenger_num.value = 21 - passenger_num.value
        //避免饼状图数据为0不重新渲染
        if(passenger_num.value==0){
            passenger_num.value= 0.01
            no_passenger_num.value = 21 - passenger_num.value
        }
        //车辆运行一半时间后，开始cover乘客图标
        setTimeout(() => {
            //单车地图cover图标
            if (carId == 1) {
                var passengerMarker = new AMap.Marker({
                    map: gdmap,
                    position: temp_array_gd[temp_array_gd.length - 1],
                    icon: new AMap.Icon({
                        size: new AMap.Size(32, 32),
                        image: "/src/assets/person.png",
                        // image: "/src/assets/passenger.png",
                        imageSize: new AMap.Size(32, 32),
                        imageOffset: new AMap.Pixel(0, 0),
                    })
                })
                gdmap.add(passengerMarker)
                //设置定时器，让乘客图标闪烁（高德地图）
                var showFlag = true
                var Marker_Timer_gd = setInterval(() => {
                    if (showFlag) {
                        passengerMarker.hide()
                        showFlag = false
                    }
                    else {
                        passengerMarker.show()
                        showFlag = true
                    }
                }, 400);
                //车辆到达目的地后，清除乘客图标 & 闪烁效果定时器
                setTimeout(() => {
                    clearInterval(Marker_Timer_gd)
                    gdmap.remove(passengerMarker)
                }, waitTime + 600);
            }
            //多车大地图cover图标（百度地图）
            var passengerMarker_baidu = new BMapGL.Marker(
                new BMapGL.Point(temp_array[temp_array.length - 1][0], temp_array[temp_array.length - 1][1]),
                {
                    icon: new BMapGL.Icon("/src/assets/person.png", new BMapGL.Size(32, 32)),
                    // icon: new BMapGL.Icon("/src/assets/passenger.png", new BMapGL.Size(32, 32)),
                })
            map.addOverlay(passengerMarker_baidu)
            //设置定时器，让乘客图标闪烁
            var showFlag_baidu = true
            var Marker_Timer_baidu = setInterval(() => {
                if (showFlag_baidu) {
                    passengerMarker_baidu.hide()
                    showFlag_baidu = false
                }
                else {
                    passengerMarker_baidu.show()
                    showFlag_baidu = true
                }
            }, 400);
            //车辆到达目的地后，清除乘客图标 & 闪烁效果
            setTimeout(() => {
                clearInterval(Marker_Timer_baidu)
                map.removeOverlay(passengerMarker_baidu)
            }, waitTime + 600);
        }, waitTime);

    })
    socket.on('send_message_realtimeDemand', (res) => {
        console.log("收到实时订单")
        console.log(res)
        let carId = res.car_id;
        let origin_point = PointSets[res.originId];
        let dest_point = PointSets[res.destId];
        let origin_passenger = new BMapGL.Marker(
            origin_point,
            {
                icon: new BMapGL.Icon("src/assets/passenger.png", new BMapGL.Size(42, 42)),
            }
        );
        let dest_passenger = new BMapGL.Marker(
            dest_point,
            {
                icon: new BMapGL.Icon("src/assets/passenger.png", new BMapGL.Size(42, 42)),
            }
        );
        map.addOverlay(origin_passenger);
        map.addOverlay(dest_passenger);
        // 设置定时器让图标闪烁
        let IsPassengerShow = true;
        let passengerTimer = setInterval(() => {
            if (IsPassengerShow) {
                origin_passenger.hide();
                dest_passenger.hide();
                IsPassengerShow = false;
            }
            else {
                origin_passenger.show();
                dest_passenger.show();
                IsPassengerShow = true;
            }
        }, 400)
        // 闪烁4s后消失
        setTimeout(() => {
            clearInterval(passengerTimer);
            map.removeOverlay(origin_passenger);
            map.removeOverlay(dest_passenger);
        }, 4000)
        let message = `${carId}号小车`;
        let message1 = `一个实时订单被分配给了${carId}号小车`
        real_time_demand.value = message1;
        showrealdemand.value = true;
        setTimeout(() => {
            showrealdemand.value = false;
        }, 5000)
        
    })
    socket.on('send_message_location', (res) => {
        let prevPoint = null
        let carId = res.car_id
        let lng = res.location[0], lat = res.location[1]
        let tempPoint = new BMapGL.Point(lng, lat)
        if (carId == 1) {
            //刷新时间轴
            real_time.value = res.system_time
            percentage.value = (res.system_ConvertedTime / 40) * 100
            //线性插值实现小车平滑移动
            prevPoint = MarkerCar_01.getPosition();
            // MarkerCar_01.setRotation(ComputeRotation(prevPoint, tempPoint, map))
            let patharray = getPoints(prevPoint, tempPoint, 7)
            let index = 0, length = patharray.length
            let smoothTimer = setInterval(() => {
                if (index >= length) {
                    clearInterval(smoothTimer)
                    // MarkerCar_01.setPosition(tempPoint)
                }
                else if (index <= length - 1) MarkerCar_01.setPosition(patharray[index++])
            }, 60);
        }
        else if (carId == 2) {
            //刷新时间轴
            real_time.value = res.system_time
            percentage.value = (res.system_ConvertedTime / 40) * 100
            //线性插值实现小车平滑移动
            prevPoint = MarkerCar_02.getPosition();
            // MarkerCar_02.setRotation(ComputeRotation(prevPoint, tempPoint, map))
            let patharray = getPoints(prevPoint, tempPoint, 7)
            let index = 1, length = patharray.length
            let smoothTimer = setInterval(() => {
                if (index >= length) {
                    clearInterval(smoothTimer)
                    // MarkerCar_02.setPosition(tempPoint)
                }
                if (index <= length - 1) MarkerCar_02.setPosition(patharray[index++])
            }, 65);
        }
        else {
            //刷新时间轴
            real_time.value = res.system_time
            percentage.value = (res.system_ConvertedTime / 40) * 100
            //线性插值实现小车平滑移动
            prevPoint = MarkerCar_03.getPosition();
            // MarkerCar_03.setRotation(ComputeRotation(prevPoint, tempPoint, map))
            let patharray = getPoints(prevPoint, tempPoint, 7)
            let index = 1, length = patharray.length
            let smoothTimer = setInterval(() => {
                if (index >= length) {
                    clearInterval(smoothTimer)
                    // MarkerCar_03.setPosition(tempPoint)
                }
                if (index <= length - 1) MarkerCar_03.setPosition(patharray[index++])
            }, 65);
        }
    })
}

/*************初始化页面*********** */
onMounted(() => {
    //初始化地图
    map = new BMapGL.Map("allmap")
    map.enableScrollWheelZoom();
    map.centerAndZoom(new BMapGL.Point(118.965069, 32.120852), 18);
    map.setMapStyleV2({
        styleJson: styleJson
    })
    map.setHeading(108);
    map.setTilt(46);
    // //显示点标记
    // for (let marker of MarkerSets) {
    //     map.addOverlay(marker);
    // }
    //显示标签
    for (let label of LabelSets) {
        map.addOverlay(label);
    }
    //高德地图初始化
    //layer1 = new AMap.TileLayer.Satellite()
    gdmap = new AMap.Map("gdmap", {
        resizeEnable: true,
        center: [118.951742391866, 32.123405409006],
        zoom: 20,
        pitch: 55.94919957310569,
        rotation: -0.7908261543741522,
        viewMode: '3D', //开启3D视图,默认为关闭
        buildingAnimation: true, //楼块出现是否带动画
        showLabel:false
        //layers: new AMap.TileLayer.Satellite(),
    });


    passedPolyline = new AMap.Polyline({
        map: gdmap,
        showDir: true,
        strokeColor: "#28F", //线颜色
        strokeWeight: 6, //线宽
    });
    let icon_gd = new AMap.Icon({
        size: new AMap.Size(32, 58),
        // image: "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png",
        image: "src/assets/car.png",
        imageSize: new AMap.Size(32, 58),
        imageOffset: new AMap.Pixel(0, 0),
    })
    marker_gd = new AMap.Marker({
        map: gdmap,
        position: [118.951742391866, 32.123405409006],
        icon: icon_gd,
        offset: new AMap.Pixel(-13, -26),
        angle: -30,
    });
    gdmap.add(marker_gd)
    //高德地图中心点跟随小车移动
    marker_gd.on('moving', function (e) {
        passedPolyline.setPath(e.passedPath);
        // 设置地图中心点
        gdmap.setCenter(e.target.getPosition())
        // 设置旋转角
        gdmap.setRotation(-e.target.getOrientation())
    });

    gdmap.setFitView();
    AMap.plugin('AMap.MoveAnimation', () => {
        console.log("动画插件加载完毕")
    })
    MarkerCar_01 = new BMapGL.Marker(PointSets[0], {
        icon: new BMapGL.Icon("src/assets/car_new_1.png", new BMapGL.Size(42, 42)),
    });
    MarkerCar_02 = new BMapGL.Marker(PointSets[0], {
        icon: new BMapGL.Icon("src/assets/car_new_2.png", new BMapGL.Size(42, 42))
    });
    MarkerCar_03 = new BMapGL.Marker(PointSets[0], {
        icon: new BMapGL.Icon("src/assets/car_new_3.png", new BMapGL.Size(42, 42))
    });
    map.addOverlay(MarkerCar_01)
    map.addOverlay(MarkerCar_02)
    map.addOverlay(MarkerCar_03)
})
</script>

<style>

#allmap {
    width: 100%;
    height: 100%;
   /* position: relative;
    z-index: 1;
     overflow: hidden; */
}
/* < !--去掉文字 --> */
.BMap_cpyCtrl {
    display: none;
}

/* < !--去掉LOGO --> */
.anchorBL {
    display: none;
}
.messagepop {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #DAAC15;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 999;
}

.amap-logo {
    display: none;
    opacity: 0 !important;
}

.amap-copyright {
    opacity: 0;
}

.common-layout {
    width: 100%;
    height: 100%;
}
.car-tag {
    display: flex;
    justify-content: space-between;
    margin-left: 15%;
    margin-right: 6%;
    margin-top: 0;
}

.test-button {
    padding-bottom: 1vh;
}
.maincontent {
    margin: 0%;
    padding: 0%;
    width: 100%;
    height: 100%;
    /*position: relative;*/
}
.title-text {
    /*设置标题渐变色效果*/
    background: linear-gradient(to right, #56EEFE, #D579FC); /*设置渐变的方向从左到右 颜色从ff0000到ffff00*/
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    font-size: 3vh;
}

.v-card {
  width: 100%;
  height: 100%;
}

.page-title {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    justify-content: center;
    align-items: center;
    z-index: 999;
    background-image: url("B:/HikingNiNanbase/src/assets/title.png");
    background-size: 100%,100%;
    background-repeat: no-repeat;
    padding: 0%;
    height: 5vh;
    width: 100%;
    opacity:1
}


.view-controler {
    display: flex;
    position: absolute;
    flex-direction: column;
    padding: 2vh;
    bottom: 10vh;
    left: 75vh;
    width: 40vh;
    height: 20vh;
    z-index: 999;
    background-image: url('src/assets/vertical5.png');
    background-size: cover;
    background-repeat: no-repeat
}

.timeline-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    /* grid-template-rows: repeat(2, 1fr); */
    grid-gap: 8px;
    max-height: 70vh;
    overflow: auto;
    
}   

.timeline {
    /* border: 1px solid #ccc; */
    padding: 3px;

}

.chart {
    height: 20vh;
    width: 100%;
}

.card-header {
    display: flex;
    justify-content:left;
    margin-top: 2%;
}

.cardtitle{
    justify-content: center;
    font-size: 20px;
    color: #32C5FF;

}

.card-content {
    font-size: 14px;
    margin-bottom: 1vh;
}
.box-card {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2%;
    padding-top: 1vh;
    width: 52vh;
    height:32vh;
    position: absolute;
    bottom: 9vh;
    right: 1vh;
    z-index: 999;
    background-image: url('src/assets/bg-line.png');
    background-size: cover;
}
.message-container {
    position: absolute;
    padding: 2%;
    padding-top: 1vh;
    padding-left: 4%;
    padding-right: 4%;
    width: 50vh;
    bottom: 9vh;
    left: 1vh;
    z-index: 999;
    background-image: url('src/assets/bg-line.png');
    background-size:cover;
}
.gdmap-container {
    padding: 2vh;
    padding-left: 4vh;
    position: absolute;
    top: 15vh;
    right: 2vh;
    z-index: 999;
    background-image: url('src/assets/bg-line.png');
    background-size: cover;
    background-repeat: no-repeat
}

</style>