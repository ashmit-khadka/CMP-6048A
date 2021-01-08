import React, { useRef, useEffect, useState } from "react";
import {
  select,
  scaleLinear,
  line,
  max,
  curveCardinal,
  axisTop,
  axisBottom,
  axisLeft,
  axisRight,
  zoom,
  zoomTransform,
  mouse,
  area
} from "d3";

const data = Array.from({ length: 50 }, () => Math.round(Math.random() * 100))
var resizeTimer = 0
let calculatedDomain = [-1000,1000]
let rangeCount = 0

const Graph = (props) => {
    //console.log(props.lines)
    const svgRef = useRef();
    const wrapperRef = useRef();
    const [currentZoomState, setCurrentZoomState] = useState();
    const graph = document.getElementById("graph")

    const [dimensions, setDimensions] = useState({
        height: window.innerHeight-50,
        width: window.innerWidth-350-100
    })
    //const graph = select(wrapperRef.current)
    //Adjust graph to resize
    window.addEventListener('resize', ()=> {
        
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
                        // Run code here, resizing has "stopped"
            setDimensions({
                height: graph.offsetHeight,
                width: graph.offsetWidth
            })
            console.log('Resized')
                    
        }, 250);

    })

    //console.log(props.lines)
    // will be called initially and on every data change
    useEffect(() => {
        //console.log('creating graph..')
        createGraph()
        //console.log(props.items)
    }, [currentZoomState, props.lines, props.points, dimensions, props.items]);

    const createGraph = () => {

        const svg = select(svgRef.current);
        let width = dimensions.width
        let height = dimensions.height
    
    
        // scales + line generator
        const xScale = scaleLinear()
            .domain([-1000, 1000])
            .range([0, width - 10]);
    
        const yScale = scaleLinear()
            .domain([-1000, 1000])
            .range([height, 0]);
    
    
        let XAxisPos = xScale(0) //5 needs to be a scalled value.
        let YAxisPos = yScale(0) //5 needs to be a scalled value.
    
        //Insures X and Y axis do not go out of range.
        const calcXAxisPos = (YAxisOrigin) => {
            //console.log(YAxisPos)
            if (YAxisOrigin >= height) return height
            else if (YAxisOrigin <= 0) return 0
            return YAxisOrigin
        }
        const calcYAxisPos = (XAxisOrigin) => {
            //console.log(YAxisPos)
            if (XAxisOrigin >= width) return width
            else if (XAxisOrigin <= 0) return 0
            return XAxisOrigin
        }
    
        const createXaxis = (xScale) => {
            if (XAxisPos >= height) return axisTop(xScale).ticks(10) 
            return axisBottom(xScale).ticks(10)
        }
    
        const createYaxis = (yScale) => {
            if (YAxisPos <= 0) return axisRight(yScale).ticks(10) 
            return axisLeft(yScale).ticks(10)
        }
    
    
    
        if (currentZoomState) {
            const newXScale = currentZoomState.rescaleX(xScale);
            const newYScale = currentZoomState.rescaleY(yScale);
            //console.log(currentZoomState.y)
            XAxisPos = calcXAxisPos(newYScale(0))
            YAxisPos = calcYAxisPos(newXScale(0))
            //console.log(`x axis domain: ${newXScale.domain()}, y axis domain: ${newYScale.domain()}`)
    
            xScale.domain(newXScale.domain());
            yScale.domain(newYScale.domain());
        }    
    
        const lineGenerator = line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(curveCardinal);

        var areaGenerator = area()
            .x(d => xScale(d.x))
            .y0(yScale(0))
            .y1(d => yScale(d.y))
            .curve(curveCardinal);

        //console.log('lines..', props.lines)
        svg.selectAll("path").remove();        
        svg.selectAll("circle").remove();

        for (let i=0; i<props.items.length; i++) {
            if (props.items[i].visible) {
                for (let j=0; j<props.items[i].elements.areas.length; j++) {       
                    //console.log(props.items[i].elements.areas[j])       
                    svg
                    .append("path")
                    .data([props.items[i].elements.areas[j]])
                    .attr("class", "object-area")
                    .attr("stroke-width", 1.5)
                    .attr("d", areaGenerator) 
                }

                svg
                .selectAll("dot")
                .data(props.items[i].elements.dots)
                .enter().append("circle")
                .attr("r", 5)
                .attr("fill", `rgb(${props.items[i].colour.r}, ${props.items[i].colour.g}, ${props.items[i].colour.b})`)
                .attr("cx", function(d) { return xScale(d.x); })
                .attr("cy", function(d) { return yScale(d.y); })      

                svg
                .append("path")
                .data([props.items[i].elements.lines])
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", `rgb(${props.items[i].colour.r}, ${props.items[i].colour.g}, ${props.items[i].colour.b})`)
                .attr("d", lineGenerator)
            }           
        }

        // axes
        const xAxis = createXaxis(xScale);
        svg
            .select(".x-axis")
            .style("transform", `translateY(${XAxisPos}px)`)
            .call(xAxis);
    
        const yAxis = createYaxis(yScale);
        svg
            .select(".y-axis")
            .style("transform", `translateX(${YAxisPos}px)`)
            .call(yAxis);
    
        //Create gridlines
        const xAxisGrid = axisBottom(xScale).tickSize(-height).tickFormat('').ticks(50);
        const yAxisGrid = axisRight(yScale).tickSize(-width).tickFormat('').ticks(50);
        svg.select("#x-axis-grid")
            .call(xAxisGrid)
            .style("transform", `translateY(${height}px`)
            //.style("transform", `translate(${domainOffset.x}px, ${dimensions.height + domainOffset.y}px)`)
    
        svg.select("#y-axis-grid")
            .call(yAxisGrid)
            .style("transform", `translateX(${width}px`)
            //.style("transform", `translate(${dimensions.width + domainOffset.x}px, ${domainOffset.y}px)`)
    
        //Create point gridlines
        const xAxisGridPoint = axisBottom(xScale).tickSize(-height).tickFormat('').ticks(10);
        const yAxisGridPoint = axisRight(yScale).tickSize(-width).tickFormat('').ticks(10);
        svg.select("#x-axis-point-grid")
            .call(xAxisGridPoint)
            .style("transform", `translateY(${height}px`)
            //.style("transform", `translate(${domainOffset.x}px, ${dimensions.height + domainOffset.y}px)`)
    
        svg.select("#y-axis-point-grid")
            .call(yAxisGridPoint)
            .style("transform", `translateX(${width}px`)
            //.style("transform", `translate(${dimensions.width + domainOffset.x}px, ${domainOffset.y}px)`)
    
        // zoom
        const zoomBehavior = zoom()
            .scaleExtent([0.005, 300])
            .translateExtent([
                [0, 0],
                [width, height]
            ])
            .on("zoom", () => {
                const zoomState = zoomTransform(svg.node());
                setCurrentZoomState(zoomState);
            });
    
        svg.call(zoomBehavior);         
    }

    return (
        <div ref={wrapperRef} id="graph" className="graph">

            <svg ref={svgRef} className="testSVG">
                <g id="x-axis-grid" className="graph__svg__axis-grid" />
                <g id="y-axis-grid" className="graph__svg__axis-grid" />
                <g id="x-axis-point-grid" className="graph__svg__axis-grid-point" />
                <g id="y-axis-point-grid" className="graph__svg__axis-grid-point" />
                <g className="x-axis" />
                <g className="y-axis" />
                <g className="content" clipPath={`url(#${''})`}></g>
            </svg>
        </div>
    )
}

export default Graph