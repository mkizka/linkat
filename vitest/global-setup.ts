import { execSync } from "child_process";

const globalSetup = () => {
  execSync("./scripts/setup-for-test.sh", { stdio: "inherit" });
};

export default globalSetup;
