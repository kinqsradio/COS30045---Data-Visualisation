// Define the width and height of the visualization
var width = 1000;
var height = 720;

// SVG element
var svg;

// Function to return color range for heatmap
function getColorRange() {
    return d3.scaleQuantize()
        .range([
            'rgb(220, 237, 200)',
            'rgb(176, 212, 141)',
            'rgb(126, 188, 97)',
            'rgb(90, 174, 80)',
            'rgb(64, 157, 66)',
            'rgb(35, 139, 69)',
            'rgb(35, 132, 67)',
            'rgb(29, 115, 56)',
            'rgb(26, 102, 45)'
        ]);
}

// Function to create an SVG container
function createSVG(width, height) {
    return d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
}

// Function to get the geographical projection for the map
function getProjection(width, height) {
    return d3.geoMercator()
        .translate([width / 2, height / 2]) // Center the map
        .scale(width / (2 * Math.PI) -35); // Set scale factor
}

// Function to get the path using the projection
function getPath(projection) {
    return d3.geoPath().projection(projection);
}

// Function to create a heatmap with the given SVG, path, color, json data, projection, and year
function createHeatMap(svg, path, color, json, projection, year) {
  svg.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function(d) {
          var value = d.properties["value" + year];
          var formattedValue = value ? value : "Not available"; // Replace undefined values with "Not available"

          if (d.properties.name === 'Australia') {
              return 'rgb(255, 255, 0)';
          }

          return value ? color(value) : "#CCC";
      })
      .style("stroke", "black")
      .style("stroke-width", "0.5")
      .on("mouseover", function(event, d) {
        var tooltip = d3.select("#tooltip");
        var tooltipText = d3.select("#tooltip-text");
    
        tooltipText.html("<b>" + d.properties.name + "</b><br>" + year + ": " + (d.properties["value" + year] || "Not available")); // Replace undefined values in the tooltip with "Not available"
          tooltip.style("visibility", "visible")
              .style("left", (event.pageX - 410)  + "px")
              .style("top", (event.pageY -150) + "px");

        d3.select(this)
        .style("stroke", "black")
        .style("stroke-width", 2);
      })
      .on("mouseout", function() {
        var tooltip = d3.select("#tooltip");
        tooltip.style("visibility", "hidden");
        d3.select(this)
        .style("stroke", null)
        .style("stroke-width", null);
    });
}

// Function to update the map for the given year
function update(year) {
    svg.selectAll("path").remove(); // Remove existing paths

    var projection = getProjection(width, height);
    var path = getPath(projection);
    var color = getColorRange();

    d3.csv("/data/source-countries/source-countries.csv").then(function(countryData) {
        countryData.forEach(function(d) {
            d["2011"] = +d["2011"];
            d["2021"] = +d["2021"];
        });

        color.domain([
            d3.min(countryData, function(d) { return Math.min(d["2011"], d["2021"]); }),
            d3.max(countryData, function(d) { return Math.max(d["2011"], d["2021"]); })
        ]);

        d3.json("/data/source-countries/custom-geo.json").then(function(json) {
            for (var i = 0; i < countryData.length; i++) {
                var dataCountry = countryData[i]["Country of birth"];
                var dataValue2011 = countryData[i]["2011"];
                var dataValue2021 = countryData[i]["2021"];

                for (var j = 0; j < json.features.length; j++) {
                  var jsonCountry = json.features[j].properties.name;
                  if (dataCountry == jsonCountry) {
                      json.features[j].properties["value2011"] = dataValue2011;
                      json.features[j].properties["value2021"] = dataValue2021;
                      break;
                  }
              }
          }
          createHeatMap(svg, path, color, json, projection, year);
      });
  });
}

// Function to load data and create the map
function loadDataAndCreateMap(svg, path, color, projection) {
  d3.csv("/data/source-countries/source-countries.csv").then(function(countryData) {
      countryData.forEach(function(d) {
          d["2011"] = +d["2011"];
          d["2021"] = +d["2021"];
      });

      color.domain([
          d3.min(countryData, function(d) { return Math.min(d["2011"], d["2021"]); }),
          d3.max(countryData, function(d) { return Math.max(d["2011"], d["2021"]); })
      ]);

      d3.json("/data/source-countries/custom-geo.json").then(function(json) {
          for (var i = 0; i < countryData.length; i++) {
              var dataCountry = countryData[i]["Country of birth"];
              var dataValue2011 = countryData[i]["2011"];
              var dataValue2021 = countryData[i]["2021"];

              for (var j = 0; j < json.features.length; j++) {
                  var jsonCountry = json.features[j].properties.name;
                  if (dataCountry == jsonCountry) {
                      json.features[j].properties["value2011"] = dataValue2011;
                      json.features[j].properties["value2021"] = dataValue2021;
                      break;
                  }
              }
          }
          createHeatMap(svg, path, color, json, projection, "2011");
      });
  });
}

// Function to create a legend on the SVG
function createLegend(svg) {
  var color = getColorRange();

  var legendData = [
      { text: "Australia", color: 'yellow' },
      { text: "Low Migration", color: color.range()[0] },
      { text: "Medium Migration", color: color.range()[Math.floor(color.range().length / 2)] },
      { text: "High Migration", color: color.range()[color.range().length - 1] }
  ];

  var legend = svg.append("g")
      .attr("transform", "translate(" + (width - 200) + "," + (height - 150) + ")");

  legend.selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", function(d, i) { return i * 30; })
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", function(d) { return d.color; });

  legend.selectAll("text")
      .data(legendData)
      .enter()
      .append("text")
      .attr("x", 30)
      .attr("y", function(d, i) { return i * 30 + 15; })
      .text(function(d) { return d.text; });
}

// Main function to create the SVG, load the data, and create the map and legend
function main() {
  svg = createSVG(width, height);
  var projection = getProjection(width, height);
  var path = getPath(projection);
  var color = getColorRange();

  loadDataAndCreateMap(svg, path, color, projection);
  createLegend(svg);

  var updateButtons = document.querySelectorAll("#update-button");
  updateButtons.forEach(function(button) {
      button.addEventListener("click", function() {
          var selectedYear = button.value;
          update(selectedYear);
      });
  });
}

// Call the main function when the window is loaded
window.onload = function() {
  main();
};
