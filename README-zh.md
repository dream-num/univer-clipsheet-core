# **univer-clipsheet-core**

**univer-clipsheet-core** 是 **Univer Clipsheet** 功能的核心实现。该包将功能模块划分为多个独立的子模块，以实现更好的可扩展性和可维护性，主要包括 `workflow`、`scraper`、`ui` 和 `table`。下面是对各模块及其组件的关键使用介绍。

[English](./README.md) | **简体中文**

## **Workflow**

### **WorkflowService**

- **`WorkflowService.runWorkflow()`**
  执行一个工作流并返回响应结果。

- **`WorkflowService.onWorkflowDone()`**
  工作流执行完成后触发的生命周期方法。

## **Scraper**

### **ScraperService**

- **`ScraperService.runScraper()`**
  执行爬虫并返回提取的数据。

- **`ScraperService.stopScraper()`**
  停止当前运行的爬虫。

### **DrillDownService**

- **`DrillDownService.runDrillDown()`**
  执行下钻操作，捕获嵌套或详细数据。

- **`DrillDownService.stopDrillDown()`**
  停止当前运行的下钻操作。

## **UI**

以下服务处理与用户界面的通信和数据交换：

- **`WorkflowPanelViewService`**
  管理工作流面板中的数据和交互。

- **`PopupViewService`**
  处理弹出页面的数据交换和用户交互。

- **`ClientViewService`**
  管理面向客户端的用户界面，提供用户交互服务。

- **`SidePanelViewService`**
  提供侧边面板视图的功能，并与 UI 交换数据。

## **Table**

**Table** 模块负责管理用于存储和显示网页抓取结果的表格数据结构。该包包含以下功能：

- **`TableService.addTable()`**
  向系统中添加一个新表格来管理抓取的数据。

- **`TableService.deleteTable()`**
  删除系统中现有的表格。

### **DataSource**

每个核心服务类——**TableService**、**ScraperService** 和 **WorkflowService**——都包含一个 `dataSource` 属性。`dataSource` 是一个抽象类，定义了与实际数据交互的方法和结构。

`dataSource` 设计的关键特点在于其灵活性：

- 通过外部实现自定义 `dataSource`，可以根据需求灵活操作数据。
- 开发者可以实现自己的数据处理逻辑，比如将数据保存到数据库、在存储数据前进行处理，或者与第三方数据系统进行集成。

### **DataSource 使用示例**

每个服务类提供了一个默认的 `dataSource`，但您可以在创建或配置服务时，定义并传入您自己的自定义实现。

```javascript
// 创建自定义 DataSource 的示例
class CustomDataSource extends ITableDataSource {
    constructor() {
        super();
    }

  // 实现数据操作所需的方法
    add(data) {
    // 自定义添加数据的逻辑
    }

    getList() {
    // 自定义获取数据的逻辑
    }

    delete(id) {
    // 自定义删除数据的逻辑
    }
}

new Injector([
    [ITableDataSource, { useClass: CustomDataSource }],
]);
```

通过使用 `dataSource` 抽象，您可以灵活地定制数据的处理方式，确保您的爬取和工作流过程能够顺利地与系统的其他部分集成。

## 许可证

本项目基于 **MIT License** 授权。详细信息请参阅 [LICENSE](./LICENSE) 文件。
