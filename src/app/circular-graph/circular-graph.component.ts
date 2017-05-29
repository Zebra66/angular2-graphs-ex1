import {Component, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import { SimpleNotificationsModule, NotificationsService } from 'angular2-notifications-lite';

import * as go from "gojs";


@Component({
    selector: 'app-circular-graph',
    template: `<h1>{{name}}</h1>
    <h2>Circular Graph with Angular 2 and GoJS</h2>
    <h2>A car needs to travel through the whole circular graph. At each node it <u>adds</u> the amount of fuel written at the node. And when it travels through a link
    it <u>consumes</u> the amount of fuel written in this link.</h2>
    <h2>at any point in time, the car CAN NOT travel with negative amount of fuel!!</h2>
    <h2><u>Please</u> select a node and see if the car can complete the path without running out of fuel</h2>
    <div #myCircularDiagramDiv style="border: solid blue 1px; width:95%; height:400px"></div>
    <simple-notifications [options]="options"></simple-notifications>
    `,
})


export class CircularGraphComponent implements AfterViewInit {

    name = 'Find car path Demo';
    m_diagram: any = null;

    @ViewChild('myCircularDiagramDiv')
    element: ElementRef;
    _notificationsService: NotificationsService;

    public options = {
      position: ["bottom", "right"],
      timeOut: 2000,
      lastOnBottom: true
    };

    constructor(private _service: NotificationsService)
    {
      this._notificationsService = _service;
    }

    clearHighlight() : void
    {
        this.m_diagram.startTransaction("no highlighteds");
        this.m_diagram.clearHighlighteds();
        this.m_diagram.commitTransaction("no highlighteds");
    }

    onNodeClicked(node: go.Node) : void {
        console.log("onNodeClicked() node=" + node);
        let myKey = node.part.data.key;
        let fuelLeft = 0;
        let link: go.Link;
        while (true)
        {
          fuelLeft += node.part.data.fuelAdded;
          console.log("onNodeClicked() fuelLeft (1): " + fuelLeft);
          // find next link and calculate the fuel it consumes
          let itLink = node.findLinksOutOf();
          itLink.next();
          link = itLink.value;
          fuelLeft -= link.part.data.fuelConsumed;
          // traverse to the next node
          let it = node.findNodesOutOf();
          if (it.next())
          {
            node = it.value;
            // if we travered through ALL the nodes, it means we finished and found a working path!!!
            if (node.part.data.key === myKey)
            {
              console.log("onNodeClicked() found a working path!!!!!");
              this._notificationsService.success("You Win!!!!", "You completed the circle with enough fuel :)");
              return;
            }
          }
          console.log("onNodeClicked() fuelConsumed="+ link.part.data.fuelConsumed + " fuelLeft="+fuelLeft);
          if (fuelLeft < 0)
          {
            console.log("onNodeClicked() ERROR!!! No More Fuel on node: " + node.part.data.key);
            this._notificationsService.error("You failed!!!!", "You ran out of fuel before completing the circle");
            return;
          }
        }
    }

    getRandomNumber(upTo: number) : number
    {
      return Math.floor((Math.random() * upTo) + 1);
    }

    getInCircularGraphModel(startingNumber: number, numberOfNodes: number) : go.GraphLinksModel
    {
      let linkArray = [];
      let nodeArray = [];
      let i: number;
      let fuelLeft = startingNumber;
      let fuelAdded = fuelLeft;
      let distance = 0;
      for (i=0; i<numberOfNodes; i++)
      {
        nodeArray.push({key: "N"+i, color: "lightblue", label: fuelAdded + "Km", fuelAdded: fuelAdded});
        if (i != 0)
        {
          linkArray.push({from: "N"+(i-1), to: "N"+i, text: distance+"Km", fuelConsumed: distance});
        }
        distance = this.getRandomNumber(fuelLeft);
        fuelLeft -= distance;
        fuelAdded = this.getRandomNumber(50);
        fuelLeft += fuelAdded;
      }
      linkArray.push({from: "N"+(numberOfNodes-1), to: "N"+0, text: distance+"Km", fuelConsumed: distance});
      let model = new go.GraphLinksModel(nodeArray, linkArray);

      return model;
    }

    ngAfterViewInit() {
        //(go as any).licenseKey = "...";

        const $ = go.GraphObject.make;  // for conciseness in defining templates

        const myDiagram: go.Diagram = $(go.Diagram, this.element.nativeElement,
            {
                initialContentAlignment: go.Spot.Center,  // center the content
                "undoManager.isEnabled": true,  // enable undo & redo
                layout: $(go.CircularLayout, // specify a Diagram.layout that arranges trees
                    {spacing: 45})
            });

        // define a simple Node template
        myDiagram.nodeTemplate =
            $(go.Node, "Auto",
                { // when the user clicks on a Node, highlight all Links coming out of the node
                    // and all of the Nodes at the other ends of those Links.
                    click: (e, node) => {
                        this.onNodeClicked(node);
                    }  // defined below
                },
                $(go.Shape, "Rectangle",
                    {strokeWidth: 2, stroke: null},
                    new go.Binding("fill", "color"),
                    // the Shape.stroke color depends on whether Node.isHighlighted is true
                    new go.Binding("stroke", "isHighlighted", function (h) {
                        return h ? "yellow" : "black";
                    })
                        .ofObject()),
                $(go.TextBlock,
                    {margin: 10, font: "bold 18px Verdana"},
                    new go.Binding("text", "label"))
            );

        //myDiagram.isReadOnly = true;

        // define the Link template
        myDiagram.linkTemplate =
            $(go.Link,
                {routing: go.Link.Normal, toShortLength: 4, selectable: false},
                $(go.Shape,
                    {isPanelMain: true, stroke: "black", strokeWidth: 1},
                    // the Shape.stroke color depends on whether Link.isHighlighted is true
                    new go.Binding("stroke", "isHighlighted", function (h) {
                        return h ? "red" : "black";
                    })
                        .ofObject()),
                $(go.Shape,
                    {toArrow: "standard", stroke: null, strokeWidth: 0},
                    // the Shape.fill color depends on whether Link.isHighlighted is true
                    new go.Binding("fill", "isHighlighted", function (h) {
                        return h ? "red" : "black";
                    })
                        .ofObject()),
                $(go.TextBlock,                        // this is a Link label
                    new go.Binding("text", "text"))
            );

        myDiagram.addDiagramListener("ObjectSingleClicked",
            (e) => {
                let part = e.subject.part;
                if (!(part instanceof go.Link)) {
                    console.log("Clicked on " + part.data.key);
                }
            });

        myDiagram.isReadOnly = true;

        // when the user clicks on the background of the Diagram, remove all highlighting
        myDiagram.click = (e) => {
            this.clearHighlight();
        };

        this.m_diagram = myDiagram;

        // create the model data that will be represented by Nodes and Links
        myDiagram.model = this.getInCircularGraphModel(40, 6);
        console.log("nodeDataArray.length = " + myDiagram.model);
        
        /*
        new go.GraphLinksModel(
            [
                {key: "A", color: "lightblue"},
                {key: "B", color: "lightblue"},
                {key: "C", color: "lightblue"},
                {key: "D", color: "lightblue"}
            ],
            [
              {from: "A", to: "B"},
              {from: "B", to: "C"},
              {from: "C", to: "D"},
              {from: "D", to: "A"}
            ]);
          */
    }


}
