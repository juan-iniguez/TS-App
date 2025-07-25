const today = new Date();

axios.get('/api/reports/monthly/'+(today.getMonth()) + '/' + (today.getFullYear()))
.then(res=>{
  console.log(res);
  initGraph(res.data);
})
.catch(err=>{

})

function initGraph(data){
  const ctx = document.getElementById("chart-1")
  
  new Chart(ctx, {
      type: data.type,
      data: {
        labels: data.labels,
        datasets: [{
          label: "Total APL Discount",
          data: data.data,
          borderWidth: 1
        }]
      },
      options: {
        plugins:{
          title:{
            display: true,
            text: data.label,
            font: {size:22}
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function(value,index,values){
                return '$' + value.toFixed(2);
              }
            },
            beginAtZero: true
          }
        }
      }
    });
}

