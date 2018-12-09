$(document).ready(function () {
  var index = 4;
  var monthlyPayments = [];
  var loan = 75000;
  var bankData;
  var allBanksData;
  $('#banks').change(bankChanged);
  $.getJSON('data/data.json', function(allBanks) {
    var selection = false;
    bankData = allBanks[0];
    allBanksData = allBanks;
    var selectHtml = $('#banks');
    for(var i = 0; i < allBanks.length; i++) {
      if (!selection) {
        selectHtml.append("<option selected='selected' value='" + i + "'>" + allBanks[i].name + "</option>");
        selection = true;
      } else {
        selectHtml.append("<option value='" + i + "'>" + allBanks[i].name + "</option>");
      }
    }
    bankChanged();
  });
  $('#button-add').click(function () {
    $('#monthly-payments').append(getPaymentGroup());
    index++;
  });
  $('body').on('click', '.delete-row', function () {
    $(this).parent().parent().remove();
  });

  $('#button-calculate').click(function () {
    monthlyPayments = [];
    loan = $('#loan').val();
    $('#showed-data').empty();
    var years = {};
    $('.number-years').each(function () {
      var ind = $(this).attr('data-index');
      years[ind] = $(this).val();
    });
    $('.monthly-payment').each(function () {
      var ind = $(this).attr('data-index');
      if (years[ind] !== undefined) {
        monthlyPayments.push({payment: $(this).val(), years: years[ind], index: ind});
      }
    });
    monthlyPayments[monthlyPayments.length - 1].years = 200;
    calculation(monthlyPayments);
  });

  function calculation(monthlyPayments) {
      var data = bankData;
      var celosenKredit = [];
      var bankFirstInterest = parseFloat($('#bank-interest').val());
      var ucestvo = loan * bankFirstInterest;
      var tmpLoan = loan - ucestvo;
      var paymentIndex = -1;
      var paymentYears = 0;
      var interestIndex = -1;
      var interestYears = 0;
      var monthlyPayment = 0;
      var allInterest = 0;
      var mainIndex = 1;
      while (true) {
        if (paymentYears == 0) {
          paymentIndex++;
          monthlyPayment = monthlyPayments[paymentIndex].payment;
          paymentYears = monthlyPayments[paymentIndex].years;
        }
        if (interestYears == 0) {
          interestIndex++;
          interestYears = data.kamati[interestIndex].godini;
        }
        var yearInterestMoney = Math.ceil(tmpLoan * (data.kamati[interestIndex].kamata / 100));
        allInterest += yearInterestMoney;
        var realLoan = tmpLoan;
        tmpLoan = tmpLoan + yearInterestMoney;
        if (tmpLoan <= monthlyPayment * 12) {
          paymentPush(celosenKredit, realLoan, tmpLoan, tmpLoan, yearInterestMoney, data.kamati[interestIndex].kamata, mainIndex);
          break;
        }
        paymentPush(celosenKredit, realLoan, tmpLoan, monthlyPayment * 12, yearInterestMoney, data.kamati[interestIndex].kamata, mainIndex);
        tmpLoan -= monthlyPayment * 12;
        paymentYears--;
        interestYears--;
        mainIndex++;
      }
      $('#showed-data').append(createTable(celosenKredit, loan, ucestvo));
      var children = $('#showed-data').children();
      $(children[0]).append('<div class="col-md-6"><div id="chart"></div></div>');
      $('#showed-data').append('<div class="row"><div class="col-md-12" id="bar-chart"></div></div>')
      drawPieChart(loan - ucestvo, ucestvo, allInterest);
      drawBarChart(celosenKredit);
  }

  function paymentPush(list, realLoan, allLoan, paid, yearInterest, interest, index) {
    list.push({
      realLoan: realLoan, allLoan: allLoan, paid: paid, yearInterest: yearInterest,
      interest: interest, index: index, paidLoan: paid - yearInterest
    });
  }

  function setBankData() {
    $('#bank-interest').val(bankData.ucestvo);
    var bankInterestRate = $('#bank-interest-rate');
    bankInterestRate.empty();
    for (var i = 0; i < bankData.kamati.length; i++) {
      bankInterestRate.append('<tr><td>' + bankData.kamati[i].kamata + '</td><td>' + bankData.kamati[i].godini + '</td></tr>')
    }
    $('#bank-name').text(bankData.name);
  }

  function createTable(list, loan, firstPayment) {
    var allInterest = 0;
      var html = '<div class="row"><div class="col-md-6"><table class="table table-striped">'
    html += '<thead><tr><th>Year</th><th>Loan + Interest</th><th>Loan</th><th>Interest</th></tr></thead>';
    html += '<tbody>';
    for (var i = 0; i < list.length; i++) {
      html += createTableRow([list[i].index, list[i].allLoan, list[i].realLoan, list[i].yearInterest]);
      allInterest += list[i].yearInterest;
    }
    html += createTableRow(['&nbsp;', '&nbsp;', 'Taken loan', loan]);
    html += createTableRow(['&nbsp;', '&nbsp;', 'First payment', firstPayment]);
    html += createTableRow(['&nbsp;', '&nbsp;', 'Real Loan', (loan - firstPayment)]);
    html += createTableRow(['&nbsp;', '&nbsp;', 'Loan + Interest', (loan - firstPayment + allInterest)]);
    html += createTableRow(['&nbsp;', '&nbsp;', 'Interest', allInterest]);
    html += '</tbody>';
    html += '</table></div></div></div>';
    return html;
  }

  function bankChanged() {
    var index = parseInt($('#banks option:selected').val());
    bankData = allBanksData[index];
    setBankData();
  }

  function drawPieChart(loan, firstPayment, interest) {
    var tipPie = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        console.log(d);
        var toolTip = "<div class='tooltipDiv'><strong>Amount:</strong> <span style='color:#01AD4B'>" + d.value + "</span></div>";
        toolTip += "<div class='tooltipDiv'><strong>Percentage:</strong> <span style='color:#d9534f'>" + d.data.percent + "%</span></div>";
        return toolTip
      });
    var h = 300;
    var r = h / 2;
    var sum = loan + firstPayment + interest;
    var data = [{"label": "Real Loan", "value": loan, color: '#5cb85c', percent: percentage(sum, loan)},
      {"label": "First Payment", "value": firstPayment, color: '#ccc', percent: percentage(sum, firstPayment)},
      {"label": "Interest", "value": interest, color: '#d9534f', percent: percentage(sum, interest)}];


    var vis = d3.select('#chart').append("svg:svg").data([data]).attr("width", '100%').attr("height", h).append("svg:g").attr("transform", "translate(" + r + "," + r + ")");
    var pie = d3.layout.pie().value(function (d) {
      return d.value;
    });
    vis.call(tipPie);

// declare an arc generator function
    var arc = d3.svg.arc().outerRadius(r);

// select paths, use arc generator to draw
    var arcs = vis.selectAll("g.slice").data(pie).enter().append("svg:g").attr("class", "slice");
    arcs.append("svg:path")
      .attr("fill", function (d) {
        return d.data.color;
      })
      .attr("d", function (d) {
        // log the result of the arc generator to show how cool it is :)
        return arc(d);
      })
      .on('mouseover', tipPie.show)
      .on('mouseout', tipPie.hide);

// add the text
    arcs.append("svg:text").attr("transform", function (d) {
      d.innerRadius = 0;
      d.outerRadius = r;
      return "translate(" + arc.centroid(d) + ")";
    }).attr("text-anchor", "middle").text(function (d, i) {
        return data[i].label;
      }
    ).style('font-weight', 'bold')
      .on('mouseover', tipPie.show)
      .on('mouseout', tipPie.hide);
  }

  function getPaymentGroup() {
    return '<div class="form-group">'
      + '<div class="col-md-6">'
      + '<div class="input-group">'
      + '<input type="text" class="form-control monthly-payment" data-index="' + index + '" placeholder="Monthly payment" />'
      + '<span class="input-group-addon">&euro;</span>'
      + '</div>'
      + '</div>'
      + '<div class=" col-md-4">'
      + '<div class="input-group">'
      + '<input type="text" class="form-control number-years" data-index="' + index + '" placeholder="Number of years" />'
      + '<span class="input-group-addon">Years</span>'
      + '</div>'
      + '</div>'
      + '<div class="col-md-2">'
      + '<button class="delete-row btn btn-danger">Remove</button>'
      + '</div>'
      + '</div>';
  }

  function createTableRow(values) {
    var row = '<tr>';
    for (var i = 0; i < values.length; i++) {
      row += '<td>' + values[i] + '</td>';
    }
    row += '</tr>';
    return row;
  }

  function toolTipHtml(name, data) {
    if (name == 'yearInterest' || name == 'paidLoan') {
      var toolTip = "<div class='tooltipDiv'><strong>Paid:</strong> <span style='color:white'>" + data.paid + "</span></div>";
      toolTip += "<div class='tooltipDiv'><strong>Paid Loan:</strong> <span style='color:#5cb85c'>" + data.paidLoan + "</span></div>";
      toolTip += "<div class='tooltipDiv'><strong>Interest:</strong> <span style='color:#d9534f'>" + data.yearInterest + "</span></div>";
      return toolTip;
    }
    if (name == 'allLoan') {
      return "<div><strong>All Loan:</strong> <span style='color:#01AD4B'>" + data.allLoan + "</span></div>";
    }
    return "<div><strong>Real Loan:</strong> <span style='color:#D99322'>" + data.realLoan + "</span></div>";
  }

  function percentage(sum, tmp) {
    var percentage = tmp / sum;
    percentage *= 100;
    return Math.round(percentage * 100) / 100
  }

  function drawBarChart(data) {

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        return d.tooltipHtml;
      });

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    var x0 = d3.scale.ordinal()
      .rangeRoundBands([0, width], 0.1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x0)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(20)
      .tickSize(-width, 0, 0);

    var color = d3.scale.ordinal()
      .range(["#d9534f", "#5cb85c", "#01AD4B", "#D99322"]);

    var svg = d3.select("#bar-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    var yBegin;

    var innerColumns = {
      "column1": ['yearInterest', 'paidLoan'],
      "column2": ['allLoan'],
      "column3": ['realLoan']
    };
    var legendText = {
      yearInterest: 'Year Interest',
      paidLoan: 'Paid Loan',
      allLoan: 'All Loan',
      realLoan: 'Real Loan'
    };

    var columnHeaders = ['yearInterest', 'paidLoan', 'allLoan', 'realLoan'];
    color.domain(columnHeaders);
    data.forEach(function (d) {
      var yColumn = new Array();
      d.columnDetails = columnHeaders.map(function (name) {
        for (ic in innerColumns) {
          if ($.inArray(name, innerColumns[ic]) >= 0) {
            if (!yColumn[ic]) {
              yColumn[ic] = 0;
            }
            yBegin = yColumn[ic];
            yColumn[ic] += +d[name];
            return {name: name, column: ic, yBegin: yBegin, yEnd: +d[name] + yBegin, tooltipHtml: toolTipHtml(name, d)};
          }
        }
      });
      d.total = d3.max(d.columnDetails, function (d) {
        return d.yEnd;
      });
    });

    x0.domain(data.map(function (d) {
      return d.index;
    }));
    x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);

    y.domain([0, d3.max(data, function (d) {
      return d.total;
    })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);


    var project_stackedbar = svg.selectAll(".project_stackedbar")
      .data(data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function (d) {
        return "translate(" + x0(d.index) + ",0)";
      });

    project_stackedbar.selectAll("rect")
      .data(function (d) {
        return d.columnDetails;
      })
      .enter().append("rect")
      .attr("width", x1.rangeBand() - 2)
      .attr("x", function (d) {
        return x1(d.column);
      })
      .attr("y", function (d) {
        return y(d.yEnd);
      })
      .attr("height", function (d) {
        return y(d.yBegin) - y(d.yEnd);
      })
      .style("fill", function (d) {
        return color(d.name);
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".7em")
      .style("text-anchor", "end")
      .text("");

    svg.append('rect')
      .attr('x', width - 150)
      .attr('y', 20)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('width', 130)
      .attr('height', 100)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    var legend = svg.selectAll(".legend")
      .data(columnHeaders.slice().reverse())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) {
        return "translate(-30," + ((i * 20) + 30) + ")";
      });

    legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function (d) {
        return legendText[d];
      });


  }
});