d3.csv("national_health_data_2024.csv").then(function(data) {
    let attributes = ["poverty_perc", "median_household_income", "elderly_percentage", "percent_no_heath_insurance", "percent_stroke", "percent_coronary_heart_disease"];
    let currentHistogramAttribute = "poverty_perc";
    let attr1 = "poverty_perc";
    let attr2 = "median_household_income";
    let currentMapAttribute = "poverty_perc";
    let selectedCounties = new Set();

    let brushEnabled = false;
    let tooltipEnabled = true;

    data = data.map(d => {
        let formattedData = {
            cnty_fips: d.cnty_fips.padStart(5, "0"),
            display_name: d.display_name || "Unknown"
        };
        attributes.forEach(attr => formattedData[attr] = +d[attr] || 0);
        return formattedData;
    });

    let width = 500, height = 350, margin = {top: 30, right: 30, bottom: 50, left: 70};

    let attributeLabels = {
        "poverty_perc": "Poverty Percentage (%)",
        "median_household_income": "Median Household Income ($)",
        "elderly_percentage": "Elderly Population (%)",
        "percent_no_heath_insurance": "No Health Insurance (%)",
        "percent_stroke": "Stroke Percentage (%)",
        "percent_coronary_heart_disease": "Coronary Heart Disease (%)"
    };

    let histogramColors = {
        "poverty_perc": "#1f77b4",
        "median_household_income": "#5aae61",
        "elderly_percentage": "#807dba",
        "percent_no_heath_insurance": "#9467bd",
        "percent_stroke": "rgb(231, 155, 132)",
        "percent_coronary_heart_disease": "#bf812d"
    };

    let histogramTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    function createHistogram() {
        d3.select("#histogram").select("svg").remove();
        let svg = d3.select("#histogram").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        let filteredData = data.filter(d => selectedCounties.size === 0 || selectedCounties.has(d.cnty_fips));
        let x = d3.scaleLinear().domain(d3.extent(data, d => d[currentHistogramAttribute])).range([0, width]);
        let histogram = d3.histogram().domain(x.domain()).thresholds(x.ticks(20)).value(d => d[currentHistogramAttribute]);
        let bins = histogram(filteredData);
        let y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([height, 0]);
        let barColor = histogramColors[currentHistogramAttribute] || "steelblue";

        let bars = svg.selectAll("rect").data(bins);

        bars.enter().append("rect")
            .merge(bars)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#ff7f0e");
                let percentage = ((d.length / data.length) * 100).toFixed(2);
                histogramTooltip.style("visibility", "visible")
                    .html(`<strong>Range:</strong> ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>
                           <strong>Count:</strong> ${d.length}<br>
                           <strong>Percentage:</strong> ${percentage}% of total`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", event => {
                histogramTooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", barColor);
                histogramTooltip.style("visibility", "hidden");
            })
            .transition().duration(1500)
            .attr("x", d => x(d.x0))
            .attr("y", d => y(d.length))
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => height - y(d.length))
            .attr("fill", barColor);

        bars.exit().transition().duration(300).style("opacity", 0).remove();

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .text(attributeLabels[currentHistogramAttribute]);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .text("Frequency");
    }

    function createScatterplot() {
        d3.select("#scatterplot").select("svg").remove();
        let svg = d3.select("#scatterplot").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        let scatterData = data.filter(d => (selectedCounties.size === 0 || selectedCounties.has(d.cnty_fips)) && d[attr1] !== -1 && d[attr2] !== -1);
        let xScale = d3.scaleLinear().domain(d3.extent(data, d => d[attr1])).range([0, width]);
        let yScale = d3.scaleLinear().domain(d3.extent(data, d => d[attr2])).range([height, 0]);
        let scatterColor = histogramColors[currentHistogramAttribute] || "steelblue";

        let scatterTooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "8px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("visibility", "hidden");

        let circles = svg.selectAll("circle").data(scatterData);

        circles.enter().append("circle")
            .merge(circles)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#ff7f0e").attr("r", 6);
                scatterTooltip.style("visibility", "visible")
                    .html(`<strong>${d.display_name}</strong><br>
                           <strong>${attributeLabels[attr1]}:</strong> ${d[attr1]}<br>
                           <strong>${attributeLabels[attr2]}:</strong> ${d[attr2]}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", event => {
                scatterTooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", scatterColor).attr("r", 4);
                scatterTooltip.style("visibility", "hidden");
            })
            .transition().duration(1500)
            .attr("cx", d => xScale(d[attr1]))
            .attr("cy", d => yScale(d[attr2]))
            .attr("r", 4)
            .attr("fill", scatterColor);

        circles.exit().transition().duration(500).attr("r", 0).style("opacity", 0).remove();

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
        svg.append("g").call(d3.axisLeft(yScale));

        svg.append("text").attr("x", width / 2).attr("y", height + 40).attr("text-anchor", "middle").text(attributeLabels[attr1]);
        svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -50).attr("text-anchor", "middle").attr("id", "scatterplot-y-label").text(attributeLabels[attr2]);
    }

    function updateAllVisualizations() {
        createHistogram();
        createScatterplot();
        updateCMap();
    }

    function updateCMap() {
        d3.json("counties-10m.json").then(us => {
            const mapSvg = d3.select("#choropleth-map").attr("width", 700).attr("height", 450).html("").append("g");
            const projection = d3.geoAlbersUsa().translate([350, 225]).scale(800);
            const path = d3.geoPath().projection(projection);

            let mapColor = histogramColors[currentHistogramAttribute] || "steelblue";
            let filteredData = data.filter(d => selectedCounties.size === 0 || selectedCounties.has(d.cnty_fips));
            const colorScale = d3.scaleSequential().domain(d3.extent(data, d => d[currentMapAttribute])).interpolator(d3.interpolateRgb("#ffffff", mapColor));

            let mapTooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("padding", "8px")
                .style("border", "1px solid #ccc")
                .style("border-radius", "5px")
                .style("visibility", "hidden");

            mapSvg.append("text")
                .attr("x", 350)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(attributeLabels[currentMapAttribute]);

            mapSvg.selectAll("path")
                .data(topojson.feature(us, us.objects.counties).features)
                .join("path")
                .attr("d", path)
                .attr("fill", d => {
                    const county = filteredData.find(c => c.cnty_fips === d.id);
                    return county ? colorScale(county[currentMapAttribute]) : "#ddd";
                })
                .attr("stroke", "#fff").attr("stroke-width", 0.5)
                .on("mouseover", function(event, d) {
                    if (!tooltipEnabled) return;
                    let county = filteredData.find(c => c.cnty_fips === d.id);
                    if (county) {
                        d3.select(this).attr("fill", "#ff7f0e").attr("stroke-width", 2);
                        mapTooltip.style("visibility", "visible")
                        .html(`<strong>${county.display_name}</strong><br>
                               <strong>${attributeLabels[currentMapAttribute]}:</strong> ${county[currentMapAttribute]?.toFixed(1)}`)
                    
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 10) + "px");
                    }
                })
                .on("mousemove", event => {
                    if (tooltipEnabled) {
                        mapTooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
                    }
                })
                .on("mouseout", function(event, d) {
                    if (!tooltipEnabled) return;
                    let county = filteredData.find(c => c.cnty_fips === d.id);
                    if (county) {
                        d3.select(this).attr("fill", colorScale(county[currentMapAttribute])).attr("stroke-width", 0.5);
                        mapTooltip.style("visibility", "hidden");
                    }
                });

            if (brushEnabled) {
                mapSvg.append("g")
                    .attr("class", "map-brush")
                    .call(d3.brush()
                        .extent([[0, 0], [700, 450]])
                        .on("end", function(event) {
                            if (!event.selection) return;
                            let [[x0, y0], [x1, y1]] = event.selection;
                            selectedCounties = new Set();
                            mapSvg.selectAll("path").each(function(d) {
                                let [cx, cy] = path.centroid(d);
                                if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
                                    selectedCounties.add(d.id);
                                }
                            });
                            updateAllVisualizations();
                        }));
            }

            updateLegend(colorScale, d3.extent(data, d => d[currentMapAttribute]));
        });
    }

    d3.select("#histogram-selector").on("change", function() {
        currentHistogramAttribute = this.value;
        currentMapAttribute = this.value;
        attr1 = this.value;
        updateAllVisualizations();
    });

    d3.select("#scatterplot-y-selector").on("change", function() {
        attr2 = this.value;
        createScatterplot();
    });

    d3.select("#reset-button").on("click", function() {
        location.reload();
    });

    d3.select("#brush-toggle").on("change", function() {
        brushEnabled = this.checked;
        updateCMap();
    });

    d3.select("#tooltip-toggle").on("change", function() {
        tooltipEnabled = this.checked;
        updateCMap();
    });

    function updateLegend(colorScale, domain) {
        d3.select("#map-legend").selectAll("*").remove();
        const legendWidth = 300, legendHeight = 20;
        let legendSvg = d3.select("#map-legend")
            .selectAll("svg").data([null]).join("svg")
            .attr("width", legendWidth).attr("height", 100)
            .append("g").attr("transform", "translate(10,30)");

        const defs = legendSvg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");
        linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: colorScale(domain[0]) || "#ffffff" },
                { offset: "100%", color: colorScale(domain[1]) || "#000000" }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        legendSvg.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);

        legendSvg.append("text").attr("x", 0).attr("y", 35).attr("font-size", "12px").text(domain[0].toFixed(1));
        legendSvg.append("text").attr("x", legendWidth).attr("y", 35).attr("text-anchor", "end").attr("font-size", "12px").text(domain[1].toFixed(1));
        legendSvg.append("text").attr("x", legendWidth / 2).attr("y", -5).attr("text-anchor", "middle").attr("font-size", "14px").attr("font-weight", "bold").text("Color Legend");
    }

    updateAllVisualizations();
}).catch(error => console.error("Error loading data:", error));
