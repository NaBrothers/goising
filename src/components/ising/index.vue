<template>
  <div id="app" class="app-container">
    <!-- <div style="display:block;margin:0 auto;width: 450px;"> -->
    <div>
      <div class = "tab-container">
      <el-tabs v-model="activeIndex" @tab-click="handleSelect" class = "tabs">
        <el-tab-pane label="wiki" name="wiki" class = "tab"></el-tab-pane>
        <el-tab-pane label="about" name="about" class = "tab"></el-tab-pane>
      </el-tabs>
      </div>
      <!-- <el-menu :default-active="activeIndex" mode="horizontal" @select="handleSelect">
        <el-menu-item index="wiki">wiki</el-menu-item>
        <el-menu-item index="about">about</el-menu-item>
      </el-menu> -->
      <div class = "main">
        <el-card class = "canvas-container">
          <canvas id="myCanvas" width="512" height="512"></canvas>
        </el-card>
        <el-card class = "panel">
          <el-row>
            格子边长
            <el-select v-model="length" style="width: 80px" @change="go">
              <el-option
                v-for="item in sizeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>上
            <el-color-picker v-model="upColor" color-format="rgb" @change="refresh"></el-color-picker>下
            <el-color-picker v-model="downColor" color-format="rgb" @change="refresh"></el-color-picker>
          </el-row>
          <el-row>
            <el-radio v-model="simulateMode" label="metropolis">metropolis</el-radio>
            <el-radio v-model="simulateMode" label="heat-bath">heat-bath</el-radio>
            <el-radio v-model="simulateMode" label="wolff-cluster">wolff-cluster</el-radio>
          </el-row>
          <el-row>
            磁化率
            <span>{{magSus}}</span>
          </el-row>
          <el-row>
            温度
            <span>{{Math.pow(10, temperature).toFixed(2)}}</span>
            <el-slider
              v-model="temperature"
              :min="Number(-2)"
              :max="Number(1)"
              :step="Number(0.05)"
              id="temperature"
              :format-tooltip="formatTooltipT"
            ></el-slider>
          </el-row>
          <el-row>
            每帧步数
            <span>{{spfOptions[spf]}}</span>
            <el-slider
              v-model="spf"
              :min="Number(0)"
              :max="Number(12)"
              :step="Number(1)"
              id="spf"
              :format-tooltip="formatTooltipSpf"
            ></el-slider>
          </el-row>

          <el-button @click="act2" type="primary">下一步</el-button>
          <el-button @click="start" type="primary">开始</el-button>
          <el-button @click="go" type="primary">初始化</el-button>
          <el-button @click="stopAnimation" type="danger">停止</el-button>
        </el-card>
      </div>
      <el-dialog title="wiki" 
      :visible.sync="wikiEnabled" 
      width="80%"
      @close="dialogClose">
        <iframe src="https://zh.wikipedia.org/wiki/%E6%98%93%E8%BE%9B%E6%A8%A1%E5%9E%8B" 
          width="100%" height="400px"></iframe>
      </el-dialog>
      
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      //drawer: false,  显示抽屉
      simulateMode: 'metropolis',
      menuKey: '1',
      activeIndex: 'none',
      spf: 4, //step per frame
      length: 128, //边长
      temperature: 0,
      arrSum: 0,
      magSus: 0,
      upColor: "rgb(255, 255, 255)",
      downColor: "rgb(0, 0, 0)",
      //showX: 0,
      //showY: 0,
      arr: [[-1]],
      energy: 0,
      count: 0,
      c: "", //canvas
      cxt: "", //canvas.context
      //stop: '',       //控制暂停 用running代替
      image: "", //绘制图像
      running: false, //控制运行
      wikiEnabled: false,//wiki弹窗可见
      aboutEnabled: false,//about弹窗可见
      spfOptions: [1, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000],
      sizeOptions: [
        {
          value: 32,
          label: "32"
        },
        {
          value: 64,
          label: "64"
        },
        {
          value: 128,
          label: "128"
        },
        {
          value: 256,
          label: "256"
        },
        {
          value: 512,
          label: "512"
        }
      ]
    };
  },
  created() {
    setTimeout(() => {
      this.go();//初始化
      this.start();
    }, 100);//延迟100ms调用初始化 避免找不到组件
  },
  methods: {
    start(){
      this.running = true;
      let mode = this.simulateMode;
      if (mode == "metropolis")
        this.act_metro();
      else if (mode == "heat-bath")
        this.act_hb();
      else if (mode == "wolff-cluster")
        this.act_wolff();
    },
    formatTooltipSpf(val) {//格式化spf的slider的tootip
      return this.spfOptions[val];
    },
    formatTooltipT(val) {//格式化温度的slider的tootip
      return Math.pow(10, val).toFixed(2);
    },
    handleSelect(tab){
      if (tab.label == 'wiki'){
        this.wikiEnabled = true;
      }else if (tab.label == 'about'){

      }
    },
    dialogClose(){
      this.activeIndex = "none";
      this.activeIndex = "";
      //this.menuKey=this.menuKey=='1'?'0':'1';
    },
    act_hb() {
      //heat-bath方法
      if (this.running){
        if (this.simulateMode == "heat-bath"){
          let length = this.length;
          let pixelMethod = length>100;
          let stepPF = this.spfOptions[this.spf];
          let temp = this.temperature;
          for (let loop = 0; loop < stepPF; loop++){
            let element = parseInt(Math.random() * length * length);
            let x = element%length;
            let y = parseInt(element/length);
            //window.console.log('x:'+x+' y:'+y);
            let eup = this.getEnergy(x, y)*this.arr[x][y];
            let edown = -eup;
            let T = Math.pow(10, temp).toFixed(2);
            let pup = Math.exp(-eup/T);
            let pdown = Math.exp(-edown/T);
            let probup = pup/(pup+pdown);
            if (Math.random() < probup){
              if (this.arr[x][y] == -1){
                this.arr[x][y] = 1;
                this.arrSum += 2;
              }
            }else{
              if (this.arr[x][y] == 1){
                this.arr[x][y] = -1;
                this.arrSum -= 2;
              }
            }
            this.magSus = Math.pow(this.arrSum/length/length, 2);
            if (pixelMethod)
              this.draw(x, y);
            else
              this.draw2(x, y);
          }
          if (pixelMethod)
            this.cxt.putImageData(this.image, 0, 0); //刷新画布
          setTimeout(() => {
            //间隔1ms 递归调用
            this.act_hb();
          }, 1);
        }else if (this.simulateMode == "wolff-cluster"){
          this.act_wolff();
        }else if (this.simulateMode == "metropolis"){
          this.act_metro();
        }
      }
    },
    act_wolff() {
      //wolff方法
      if (this.running){
        if (this.simulateMode == "wolff-cluster"){
          let length = this.length;
          let pixelMethod = length>100;
          let stepPF = this.spfOptions[this.spf];
          let temp = this.temperature;
          //for (let loop = 0; loop < stepPF; loop ++){
            let element = parseInt(Math.random() * length * length);
            // let cluster = [{
            //   'x': element % length,
            //   'y': parseInt(element / length)
            // }];
            let cluster = new Array(length);
            for (let i = 0; i < length; i++)
              cluster[i] = new Array(length).fill(0);
            let Fold = [{
              'x': element % length,
              'y': parseInt(element / length)
            }];
            while (Fold.length != 0){
              let Fnew = [];
              for (let a = 0; a < Fold.length; a++){
                let i = Fold[a];
                for ( let p = -1; p <= 1; p += 2)
                  for ( let q = -1; q <= 1; q += 2){ //遍历neighbor
                    let j = {};
                    j.x = (i.x + ( p + q ) / 2 + length) % length;
                    j.y = (i.y + ( p - q ) / 2 + length) % length;
                    if (this.arr[i.x][i.y] == this.arr[j.x][j.y] && 
                    // !cluster.find(point => {
                    //   return point.x==j.x&&point.y==j.y;
                    // })
                    cluster[j.x][j.y] == 0
                    )//状态相同为同一族群
                    {
                      let T = Math.pow(10, temp).toFixed(2);
                      let prob = Math.exp(-2/T);
                      if (Math.random() > prob){
                        Fnew.push(j);
                        // cluster.push(j);
                        cluster[j.x][j.y] = 1;
                      }
                    }
                  }
              }
              Fold = Fnew;
            }
            //console.log(cluster);
            //for( let i = 0; i < cluster.length; i++){
              for( let i = 0; i < length; i++)
              for( let j = 0; j < length; j++){
              //this.arr[cluster[i].x][cluster[i].y] *= -1;
              if (cluster[i][j] == 1){
                this.arr[i][j]*=-1;
                this.arrSum += this.arr[i][j]*2;
                this.magSus = Math.pow(this.arrSum/length/length, 2);
                if (pixelMethod)
                  //this.draw(cluster[i].x, cluster[i].y);
                  this.draw(i,j);
                else
                  //this.draw2(cluster[i].x, cluster[i].y);
                  this.draw2(i,j);
              }
                
            }
          //}
          if (pixelMethod)
            this.cxt.putImageData(this.image, 0, 0); //刷新画布
          if (this.simulateMode == "wolff-cluster")
            setTimeout(() => {
              //间隔1ms 递归调用
              this.act_wolff();
            }, 1);
        }else if (this.simulateMode == "metropolis"){
          this.act_metro();
        }else if (this.simulateMode == "heat-bath"){
          this.act_hb();
        }
        
      }
    },
    act_metro() {
      //metropolis方法
      if (this.running) {
        if (this.simulateMode == 'metropolis'){
          let length = this.length;
          let pixelMethod = length>100;
          let stepPF = this.spfOptions[this.spf];
          let temp = this.temperature;
          for (let loop = 0; loop < stepPF ; loop++) {
            let element = parseInt(Math.random() * length * length);
            let x = element % length;
            let y = parseInt(element / length);
            let energy = this.getEnergy(x, y);
            let deltaEnergy = energy * -2;
            let T = Math.pow(10, temp).toFixed(2);
            let prob = Math.exp(-deltaEnergy / T);
            if (Math.random() < prob) {
              this.arr[x][y] *= -1;
              this.arrSum += this.arr[x][y]*2;
              this.magSus = Math.pow(this.arrSum/length/length, 2);
              if (pixelMethod)
                this.draw(x, y);
              else
                this.draw2(x, y);
            }
          }
          if (pixelMethod)
            this.cxt.putImageData(this.image, 0, 0); //刷新画布
          if (this.simulateMode == "metropolis")
            setTimeout(() => {
              //间隔1ms 递归调用
              this.act_metro();
            }, 1);
        }else if (this.simulateMode == "wolff-cluster"){
          this.act_wolff();
        }else if (this.simulateMode == "heat-bath"){
          this.act_hb();
        }
      }
    },
    act2() {
      //分步模拟
      this.next2();
      this.cxt.putImageData(this.image, 0, 0);
    },
    act() {
      //模拟函数 已弃用
      //this.c.clearRect(0,0,this.c.width,this.c.height);
      this.next2();
      //this.cxt.putImageData(this.image, 0, 0);
      this.stop = window.requestAnimationFrame(this.act);
    },
    draw(x, y) {
      //绘制坐标为xy点的矩阵的image(格子小时的快速方法)
      let length = this.length;
      let bitwise = Math.log2(length);
      var r, g, b;
      var up = JSON.parse(JSON.stringify(this.upColor));
      var down = JSON.parse(JSON.stringify(this.downColor));
      if ((this.arr[x][y]+1)>>1 & 1) {
        up = up.split("(")[1];
        up = up.split(")")[0];
        up = up.split(", ");
        r = parseInt(up[0]);
        g = parseInt(up[1]);
        b = parseInt(up[2]);
      } else {
        down = down.split("(")[1];
        down = down.split(")")[0];
        down = down.split(", ");
        r = parseInt(down[0]);
        g = parseInt(down[1]);
        b = parseInt(down[2]);
      }
      for (
        let px = (x<<9)>>bitwise;
        px < ((x + 1)<<9)>>bitwise;
        px++
      ) {
        for (
          let py = (y<<9)>>bitwise;
          py < ((y + 1)<<9)>>bitwise;
          py++
        ) {
          var index = (px + py * this.image.width)<<2;
          this.image.data[index + 0] = r;
          this.image.data[index + 1] = g;
          this.image.data[index + 2] = b;
        }
      }

      
    },
    draw2(x, y){
      //格子大时的方法
      let length = this.length;
      let bitwise = Math.log2(length);
      if ((this.arr[x][y]+1)>>1 & 1)
        this.cxt.fillStyle=this.upColor;
      else
        this.cxt.fillStyle=this.downColor;
      this.cxt.fillRect(x<<9>>bitwise,y<<9>>bitwise,512>>bitwise,512>>bitwise);
    },
    stopAnimation() {
      this.running = false;
      if (this.stop != "") window.cancelAnimationFrame(this.stop);//已弃用
    },
    refresh() {
      //刷新画布所有像素
      for (var x = 0; x < this.length; x++) {
        for (var y = 0; y < this.length; y++) {
          this.draw(x, y);
        }
      }
      this.cxt.putImageData(this.image, 0, 0);
    },
    go() {
      //矩阵与画布初始化
      //window.console.log(this.upColor);
      let sum = 0;
      this.arr = new Array();
      this.c = document.getElementById("myCanvas");
      this.cxt = this.c.getContext("2d");
      this.image = this.cxt.createImageData(this.c.width, this.c.height);
      let length = this.length;
      let pixelMethod = length >100;
      for (var i = 0; i < this.image.data.length; i += 4) {
        //image.data[i] = 255;
        //image.data[i+1] = 255;
        //image.data[i+2] = 255;
        this.image.data[i + 3] = 255;
      }
      for (var x = 0; x < this.length; x++) {
        this.arr[x] = new Array();
        for (var y = 0; y < this.length; y++) {
          if (Math.round(Math.random()) == 0) {
            this.arr[x][y] = -1;
            sum += -1;
          }else {
            this.arr[x][y] = 1;
            sum += 1;
          }
          if (pixelMethod)
            this.draw(x, y);
          else
            this.draw2(x, y);
        }
      }
      this.arrSum = sum;
      if (pixelMethod)
        this.cxt.putImageData(this.image, 0, 0);
      this.drawer = false;
    },
    next() {
      //瞎jb写的
      for (var x = 0; x < this.length; x++) {
        for (var y = 0; y < this.length; y++) {
          let left = 0;
          let right = 0;
          let up = 0;
          let down = 0;
          if (x != 0) left = this.arr[x - 1][y];
          if (x != this.length - 1) right = this.arr[x + 1][y];
          if (y != 0) up = this.arr[x][y - 1];
          if (y != this.length - 1) down = this.arr[x][y + 1];
          let sum = left + right + up + down;
          if (sum > 0) this.arr[x][y] = 1;
          else if (sum < 0) this.arr[x][y] = -1;
        }
      }

      this.draw();
    },
    next2() {
      //分步模拟
      let length = this.length;
      let temp = this.temperature;
      var newArray = [...new Array(length * length).keys()];
      newArray.sort(() => {
        return 0.5 - Math.random();
      });
      let count = 0;
      newArray.forEach(element => {
        let x = element % this.length;
        let y = parseInt(element / length);
        let energy = this.getEnergy(x, y);
        let deltaEnergy = energy * -2;
        let T = Math.pow(10, temp).toFixed(2);
        let prob = Math.exp(-deltaEnergy / T);
        //window.console.log('probability:' + prob);
        if (Math.random() < prob) {
          this.arr[x][y] *= -1;
          this.draw(x, y);
          count++;
        }
      });

      this.count = count;


    },
    getEnergy(x, y) {
      //获取xy坐标点的能量值
      let length = this.length;
      x = Number(x);
      y = Number(y);
      if (x < 0 || (x >= length) | (y < 0) || y >= length) {
        //window.console.log('false');
        return 0;
      } else {
        let sum = 0;
        for ( let i = -1; i <= 1; i += 2)
          for ( let j = -1; j <= 1; j += 2)
            sum += this.arr[(x+(i+j)/2+length)%length][(y+(i-j)/2+length)%length];
        let energy = -this.arr[x][y] * sum;
        //window.console.log(energy);
        this.energy = energy;
        return energy;
      }
    }
  }
};
</script>
  
<style lang="scss">
</style>
