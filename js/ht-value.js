/**
 * ht.DataModel 的扩展方法 by xwt
 * 依赖于 ht.js、identifier.js 与 math.js
 */

/**
 * ht.DataModel 的扩展方法
 * 根据数据对图元/组件进行颜色、状态改变
 * @param json - 传入的数据 json，要求与 DataModel 中的 'node.tag' 存在对应关系。
 */
ht.DataModel.prototype.setNodeStatusByValue = function(json) {
    let dm = this;
    json.forEach(item => {
        let node = dm.getDataByNodeTag(item.nodeTag);
        let value = Number(item.value);
        node.forEach(function(node) {
            // 如果是 普通开关
            if (node instanceof ht.Node && node.a('node.type') === 'switch') {
                node.a('switch.powerOn', Boolean(value));
                node.a('switch.powerOff', !Boolean(value));
            }
            // 如果是 旋钮开关
            if (node instanceof ht.Node && node.a('node.type') === 'switch-ro') {
                node.a('rotatySwitch.bar', Boolean(value) ? 0 : 1.57);
            }
            // 如果是 断路器
            if (node instanceof ht.Node && node.a('node.type') === 'duanluqi') {
                node.a('node.stateToggle', Boolean(value));
            }
            // 如果是 柱状图元
            if (node instanceof ht.Node && node.a('node.type') === 'zt') {
                node.s('label') ? node.s('label', String(value)): '';
                if ((value > 0 && node.a('zt.dirt') === 'top') || value < 0 && node.a('zt.dirt') === 'bottom'){
                    node.a('zt.height', Math.abs(value) / (Number(node.a('zt.max')) - Number(node.a('zt.min'))));
                } else {
                    node.a('zt.height', 0);
                }
            }
            // 如果是 Text
            if (node instanceof ht.Text) {
                node.s("text", value);
            }
            // 如果是 变色器件
            if (node instanceof ht.Node && node.a('node.bg')) {
                node.a('node.bg', value ? '#FF0000' : '#00FF00');
            }
            // 如果是 主变1
            if (node instanceof ht.Node && node.a('node.type') === 'zb1') {
                node.a('zb1.yw1', value.yw1);
                node.a('zb1.yw2', value.yw2);
                node.a('zb1.rw', value.rw);
                node.a('zb1.dw', value.dw);
            }
            // 如果是 主变2
            if (node instanceof ht.Node && node.a('node.type') === 'zb2') {
                node.a('zb2.zbyw1', value.zbyw1);
                node.a('zb2.zbyw2', value.zbyw2);
                node.a('zb2.rzyw', value.rzyw);
                node.a('zb2.dw', value.dw);
            }
            if (node instanceof ht.Node && node.a('node.type') === 'barChart') {

            }

        });
    });

    let barChartNode = dm.getDataByNodeTag('barChart')[0];
    if (barChartNode) {
        let tagArr = barChartNode.a('chart.data.series').split(',');
        let xAxisData = [], seriesData = [];
        tagArr.forEach(item => {
            json.forEach(subItem => {
               if (subItem.nodeTag === item) {
                   xAxisData.push(subItem.nodeDesc);
                   seriesData.push(subItem.value);
               }
            });
        });
        setPanelValue('bar-chart', xAxisData, seriesData);
    }
};

/**
 * ht.DataModel 的扩展方法
 * 重写的 getNodeByTag 方法，使用 'node.tag' 属性来查找组件。
 * @param tag - 进行匹配的 tag
 * @returns {[]} - 返回所有匹配到的 node
 */
ht.DataModel.prototype.getDataByNodeTag = function(tag) {
    let dm = this,
        res = [];
    dm.each(item => {
        if (item.a('node.tag') === tag) res.push(item);
    });
    return res;
};

ht.DataModel.prototype.getDataByNodeType = function(type) {
    let dm = this,
        res = [];
    dm.each(item => {
        if (item.a('node.type') === type) res.push(item);
    });
    return res;
};

ht.DataModel.prototype.removeDataByNodeTag = function (tag) {
}

ht.DataModel.prototype.removeDataByNodeType = function (type) {
    let dm = this,
        res = [];
    res = dm.getDataByNodeType(type);
    if (res.length)
        res.forEach(item => {
            this.remove(item);
        });
    return res;
};

/**
 * ht.DataModel 的扩展方法
 * 获取 DataModel 中所有含有 node.tag 属性的组件。
 * @returns {[]} - 返回所有含有 node.tag 属性的组件数组
 */
ht.DataModel.prototype.getOriginNode = function () {
    let dm = this,
        res = [];
    dm.each(item => {
        if (item.a('node.tag')) res.push(item);
    });
    return res;
};


/**
 * (Old)
 * ht.DataModel 的扩展方法
 * 获取 DataModel 中所有 tag
 * @returns {[]}
 */
ht.DataModel.prototype.getNodeTags = function (){
    let dm = this,
    nodeArr = [];
    dm.each(data => {
        let tag = data.getTag();
        if(tag) {
            nodeArr.push(tag);
        }
    });
    return nodeArr;
};

/**
 * ht.DataModel 的扩展方法
 * 针对图元/组件中包含公式（node.formula) 属性进行的预处理
 * 将 node 中的公式进行计算之后，虚拟一个 fakeTag 添加到含有公式的组件/图元的 node.tag 属性中，
 * 并以 {nodeTag: fakeTag, nodeDesc: formulaText, value: calResult} 的形式添加数据集中，
 * 以供 (func)setNodeStatusByValue 使用
 * @param json - 获取到的数据集
 * @param reg - 进行匹配的正则表达式
 * @returns {any[] | string} -
 */
ht.DataModel.prototype.formulaPreprocess = function (json, reg) {
    let dm = this,
        formulaNodeArr = [],
        resultArr = [];
    reg = reg? reg: /["'“”‘’][a-zA-Z0-9:_-]+["'“”‘’]/g;
    dm.each(item => {
        if (item.a('node.formula'))
            formulaNodeArr.push(item);
    });
    formulaNodeArr.forEach(item => {
        let formulaText = item.a('node.formula'),
            result = 0;
        let formulaFinal = formulaText.replace(reg, function (match) {
            let matchNoQM = match.replace(/["'“”‘’]/g, "");
            for (let i = 0, len = json.length; i < len; i++) {
                if (json[i].nodeTag === matchNoQM)
                    return json[i].value;
            }
        });
        try {
            result = math.eval(formulaFinal).toFixed(2);
        } catch (err) {
            console.error(`${formulaText} 公式解析错误`);
        }
        let fakeTag = 'NT-' + Identifier.uuid();
        item.a('node.tag', fakeTag);
        resultArr.push({
            nodeTag: fakeTag,
            nodeDesc: formulaText,
            value: result,
            timestamp: json[0].timestamp
        });
    });
    json = json.concat(resultArr);
    return json;
};
