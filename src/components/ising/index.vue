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
          <canvas id="myCanvas" width="400" height="400"></canvas>
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
            温度
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
            <el-slider
              v-model="spf"
              :min="Number(0)"
              :max="Number(11)"
              :step="Number(1)"
              id="spf"
              :format-tooltip="formatTooltipSpf"
            ></el-slider>
          </el-row>

          <el-button @click="act2" type="primary">下一步</el-button>
          <el-button @click="running = true;act3()" type="primary">开始</el-button>
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
      menuKey: '1',
      activeIndex: 'none',
      spf: 4, //step per frame
      length: 100, //边长
      temperature: 0,
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
      spfOptions: [1, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
      sizeOptions: [
        {
          value: 25,
          label: "25"
        },
        {
          value: 50,
          label: "50"
        },
        {
          value: 100,
          label: "100"
        },
        {
          value: 200,
          label: "200"
        },
        {
          value: 400,
          label: "400"
        }
      ]
    };
  },
  created() {
    setTimeout(() => {
      this.go();//初始化
      this.running = true;//初始化结束开始运行
      this.act3();
    }, 100);//延迟100ms调用初始化 避免找不到组件
  },
  methods: {
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
    act3() {
      //主要模拟函数
      if (this.running) {
        for (let loop = 0; loop < this.spfOptions[this.spf] ; loop++) {
          let element = parseInt(Math.random() * this.length * this.length);
          let x = element % this.length;
          let y = parseInt(element / this.length);
          let energy = this.getEnergy(x, y);
          let deltaEnergy = energy * -2;
          let T = Math.pow(10, this.temperature).toFixed(2);
          let prob = Math.exp(-deltaEnergy / T);
          if (Math.random() < prob) {
            this.arr[x][y] *= -1;
            this.draw(x, y);
          }
        }
        this.cxt.putImageData(this.image, 0, 0); //刷新画布
      }
      setTimeout(() => {
        //间隔1ms 递归调用
        this.act3();
      }, 1);
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
      //绘制坐标为xy点的矩阵的image
      var r, g, b;
      var up = JSON.parse(JSON.stringify(this.upColor));
      var down = JSON.parse(JSON.stringify(this.downColor));
      if (this.arr[x][y] == 1) {
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
        let px = (400 * x) / this.length;
        px < (400 * (x + 1)) / this.length;
        px++
      ) {
        for (
          let py = (400 * y) / this.length;
          py < (400 * (y + 1)) / this.length;
          py++
        ) {
          var index = (px + py * this.image.width) * 4;
          this.image.data[index + 0] = r;
          this.image.data[index + 1] = g;
          this.image.data[index + 2] = b;
        }
      }

      // if (this.arr[x][y] == -1)
      //   this.cxt.fillStyle="#000000";
      // else
      //   this.cxt.fillStyle="#FFFFFF";
      // this.cxt.fillRect(400*x/this.length,400*y/this.length,400/this.length,400/this.length);
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
      window.console.log(this.upColor);
      this.arr = new Array();
      this.c = document.getElementById("myCanvas");
      this.cxt = this.c.getContext("2d");
      this.image = this.cxt.createImageData(this.c.width, this.c.height);
      for (var i = 0; i < this.image.data.length; i += 4) {
        //image.data[i] = 255;
        //image.data[i+1] = 255;
        //image.data[i+2] = 255;
        this.image.data[i + 3] = 255;
      }
      for (var x = 0; x < this.length; x++) {
        this.arr[x] = new Array();
        for (var y = 0; y < this.length; y++) {
          if (Math.round(Math.random()) == 0) this.arr[x][y] = -1;
          else this.arr[x][y] = 1;
          this.draw(x, y);
        }
      }
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
      var newArray = [...new Array(this.length * this.length).keys()];
      newArray.sort(() => {
        return 0.5 - Math.random();
      });
      let count = 0;
      newArray.forEach(element => {
        let x = element % this.length;
        let y = parseInt(element / this.length);
        let energy = this.getEnergy(x, y);
        let deltaEnergy = energy * -2;
        let T = Math.pow(10, this.temperature).toFixed(2);
        let prob = Math.exp(-deltaEnergy / T);
        //window.console.log('probability:' + prob);
        if (Math.random() < prob) {
          this.arr[x][y] *= -1;
          this.draw(x, y);
          count++;
        }
      });

      this.count = count;

      // newArray.forEach(element => {
      //   let x = element%this.length;
      //   let y = parseInt(element/this.length);
      //   //window.console.log('x:'+x+' y:'+y);
      //   let eup = this.getEnergy(x, y)*this.arr[x][y];
      //   let edown = -eup;
      //   let T = this.T;
      //   let pup = Math.exp(-eup/T);
      //   let pdown = Math.exp(-edown/T);
      //   let probup = pup/(pup+pdown);
      //   if (Math.random() < probup){
      //     this.arr[x][y] = 1;
      //   }else{
      //     this.arr[x][y] = -1;
      //   }
      // });
    },
    getEnergy(x, y) {
      //获取xy坐标点的能量值
      x = Number(x);
      y = Number(y);
      if (x < 0 || (x >= this.length) | (y < 0) || y >= this.length) {
        //window.console.log('false');
        return 0;
      } else {
        let left = 0;
        let right = 0;
        let up = 0;
        let down = 0;
        let energy = 0;
        if (x != 0) left = this.arr[x - 1][y];
        if (x != this.length - 1) right = this.arr[x + 1][y];
        if (y != 0) up = this.arr[x][y - 1];
        if (y != this.length - 1) down = this.arr[x][y + 1];
        energy = -this.arr[x][y] * (left + right + up + down);
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
