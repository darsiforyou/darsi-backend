 function Days(day) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[day];
  }
  function DateFormats() {
    const yearNum = new Date().getFullYear();
    let dateObj = new Date();

    const beginDate = new Date(new Date().setDate(dateObj.getDate() - 30));
    const beginDay = Days(
        beginDate.getDay(),
      );
      const startDay = Days(
        new Date().getDay(),
      );
      const startDate = new Date().getDay();
        const curMonth = new Date().getMonth();
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const lastdate = tomorrow.getDate();
    const sdate = new Date(`${beginDay}, ${beginDate} ${curMonth} ${yearNum} 00:00:00 GMT`);
    const edate = new Date(
      `${startDay}, ${lastdate} ${curMonth} ${yearNum} 23:59:00 GMT`,
    );
    return {
      sdate,
      edate,
    };
  }
  module.exports = DateFormats;
