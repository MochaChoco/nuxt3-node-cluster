export default defineEventHandler(async (event) => {
  console.log("process id", process.pid);

  return {
    value: "hello world!",
  };
});
