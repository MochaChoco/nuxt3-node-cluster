let i = 1;

export default defineEventHandler(async (event) => {
  console.log("process id", process.pid, "//", i++, "번째 호출");

  return {
    value: "hello world!",
  };
});
