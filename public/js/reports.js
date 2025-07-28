const today = new Date();

axios.get('/api/reports/monthly/'+(today.getMonth()) + '/' + (today.getFullYear()))
.then(res=>{
  console.log(res.data[0]);
  console.log(res.data[1]);
  initGraph(res.data);
})
.catch(err=>{
  console.error(err);
})

function initGraph(data){
  const firstGraph = document.getElementById("chart-1")
  const secondGraph = document.getElementById("chart-2") 
  const infoTitles = document.getElementsByClassName('info-amount');

  // Bar Graph
  new Chart(firstGraph, {
      type: data[0].type,
      data: {
        labels: data[0].labels,
        datasets: data[0].datasets,
      },
      options: {
        interaction: {
          intersect: false,
        },
        plugins:{
          title:{
            display: true,
            text: data[0].title,
            font: {size:22}
          },
        },
        scales: {
          y: {
            stacked: true,
            ticks: {
              callback: function(value,index,values){
                return '$' + value.toFixed(2);
              }
            },
            beginAtZero: true
          },
          x: {
            stacked: true,
          }
        }
      }
    });

  new Chart(secondGraph, {
      type: data[1].type,
      data: {
        labels: data[1].labels,
        datasets: data[1].datasets
      },
      options: {
        responsive: true,
        plugins:{
          title:{
            display: true,
            text: data[1].title,
            font: {size:22}
          },
        },
      }
    });

  console.log(data[1].datasets[0].data);
  const aplTotalOCF = data[1].datasets[0].data[2] + data[1].datasets[0].data[1] + data[1].datasets[0].data[0];

    // APL OCF
  infoTitles[0].innerText = "$"+parseFloat(aplTotalOCF.toFixed(2)).toLocaleString('en-US');

  // TSP DISC
  infoTitles[1].innerText = "$"+parseFloat(data[1].datasets[0].data[0].toFixed(2)).toLocaleString('en-US');
  
  // Company Discount
  infoTitles[2].innerText = "$"+parseFloat(data[1].datasets[0].data[1].toFixed(2)).toLocaleString('en-US');


}

