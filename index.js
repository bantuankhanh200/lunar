const { spawn: s } = require("child_process");
const l = require("./main/utils/log");
const sr = (m) => {
    l('🤖 ĐANG KHỞI ĐỘNG BOT',"[ Bắt đầu ] - ")
    const c = s("node", ["--trace-warnings", "--async-stack-traces", "zeus.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });
    c.on("close", async (e) => {
        if (e == 1) return sr("🔄 Restarting!!!");
        else if (String(e).startsWith("2")) {
            await new Promise((r) => setTimeout(r, parseInt(e.replace('2', '')) * 1000));
              sr("🤖 Bot đang kiểm tra lại, chờ một chút!!!");
        }
    });
    c.on("Error", (error) => l("Đã xảy ra lỗi: " + JSON.stringify(error), "[ Bắt đầu ]"));
};
sr();