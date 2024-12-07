# **univer-clipsheet-core**

**univer-clipsheet-core** is the core implementation of the [**Univer Clipsheet**](https://github.com/dream-num/univer-clipsheet) functionality. This package is organized into separate modules for better scalability and maintainability, including `workflow`, `scraper`, `ui`, and `table`. Below, we introduce the key usage of each module and its components.

**English** | [简体中文](./README-zh.md)

## **Workflow**

### **WorkflowService**

- **`WorkflowService.runWorkflow()`**
  Executes a workflow and returns the response.

- **`WorkflowService.onWorkflowDone()`**
  This lifecycle method is invoked once a workflow has completed execution.

## **Scraper**

### **ScraperService**

- **`ScraperService.runScraper()`**
  Runs a scraper and returns the extracted data.

- **`ScraperService.stopScraper()`**
  Stops the execution of a currently running scraper.

### **DrillDownService**

- **`DrillDownService.runDrillDown()`**
  Executes a drill-down operation to capture nested or detailed data.

- **`DrillDownService.stopDrillDown()`**
  Stops a currently running drill-down operation.

## **UI**

The following services handle communication and data exchange with the user interface:

- **`WorkflowPanelViewService`**
  Manages the data and interactions within the workflow panel.

- **`PopupViewService`**
  Handles the data exchange and user interactions for the popup view.

- **`ClientViewService`**
  Manages the client-facing UI, providing services for user interaction.

- **`SidePanelViewService`**
  Provides functionality for the side panel view and exchanges data with the UI.

## **Table**

The **Table** module is responsible for managing tabular data structures used to store and display the results of web scraping. This package includes the following functions:

- **`TableService.addTable()`**
  Adds a new table to the system for managing scraped data.

- **`TableService.deleteTable()`**
  Deletes an existing table from the system.

### **DataSource**

Each of the core service classes — **TableService**, **ScraperService**, and **WorkflowService** — has a `dataSource` property. The `dataSource` is an abstract class that defines the methods and structure for interacting with the actual data.

The key aspect of the `dataSource` design is its flexibility:

- The `dataSource` can be customized by passing an external implementation to each service.
- This allows developers to implement their own data handling logic, such as saving data to a database, processing data before storing it, or integrating with third-party data systems.

### Example Usage of DataSource

Each service class provides a default dataSource, but you can define and pass your own custom implementation when creating or configuring the service.

```javascript
// Example of creating a custom DataSource
class CustomDataSource extends ITableDataSource {
    constructor() {
        super();
    }

  // Implement required methods for data operations
    add(data) {
    // Custom logic for adding data
    }

    getList() {
    // Custom logic for retrieving data
    }

    delete(id) {
    // Custom logic for deleting data
    }
}

new Injector([
    [ITableDataSource, { useClass: CustomDataSource }],
]);

```

By using the `dataSource` abstraction, you gain the flexibility to tailor how data is handled and ensure that your scraping and workflow processes integrate smoothly with the rest of your system.

## Contact

Have questions or feedback?
Feel free to open an issue on GitHub or reach out to us via email: **[developer@univer.ai](mailto:developer@univer.ai)**.
