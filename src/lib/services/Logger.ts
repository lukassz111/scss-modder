interface ILog {
    msg: string
}
class Logger {
    protected data: Array<ILog> = [];
    public log(msg: string) {
        this.data.push({msg: msg});
    }
    protected printLogs() {
        this.data.forEach(log => {
            console.log(log.msg);
        })
    }
    public flush() {
        this.data = [];
    }
    public printLogsAndFlush() {
        this.printLogs();
        this.flush();
    }
}

export const logger = new Logger();