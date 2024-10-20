import { execSync } from "child_process";

const globalSetup = () => {
  execSync("./scripts/setup-test.sh", { stdio: "inherit" });
};

export default globalSetup;
