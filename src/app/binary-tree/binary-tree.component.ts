import {Component, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import * as go from "gojs";
import { SimpleNotificationsModule, NotificationsService } from 'angular2-notifications-lite';

@Component({
    selector: 'app-binary-tree',
    template: `<h1>{{name}}</h1>
    <h2>The algorithm finds the closest Node on your right at the same level</h2>
    <h2><u>Please</u> select a Node and see the path from it to its right brother marked in RED</h2>
    <div #myDiagramDiv style="border: solid blue 1px; width:95%; height:400px"></div>
    <simple-notifications [options]="options"></simple-notifications>
    `,
})

export class BinaryTreeComponent implements AfterViewInit {
    name = 'Binary tree with Angular 2 and GoJS';
    m_diagram: any = null;

    @ViewChild('myDiagramDiv')
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

    getMyRightSon(me) {
        if (me === null)
        {
            return null;
        }
        let son = null;
        console.log("getMyRightSon() me=" + me);
        let myName = me.part.data.key;
        console.log("getMyRightSon() myName=" + myName);
        let rightSonName = myName + "_R";
        me.findNodesOutOf().each((l) => {
            if (rightSonName === l.part.data.key) {
                console.log("getMyRightSon = " + l);
                son = l;
            }
        });
        return son;
    }

    getMyLeftSon(me) {
        let son = null;
        console.log("getMyLeftSon() me=" + me);
        let myName = me.part.data.key;
        console.log("getMyLeftSon() myName=" + myName);
        let rightSonName = myName + "_L";
        me.findNodesOutOf().each((l) => {
            if (rightSonName === l.part.data.key) {
                console.log("getMyLeftSon = " + l);
                son = l;
            }
        });
        return son;
    }

    getMyParent(me) {
        let parent = null;
        me.findNodesInto().each((l) => {
            l.isHighlighted = true;
            parent = l;
        });
        return parent;
    }

    getMyRightBrother(node) {
        let parent = this.getMyParent(node);
        if (parent === null) {
            return null;
        }
        let rightSon = this.getMyRightSon(parent);
        if (rightSon === null) {
            return null;
        }
        if (node.part.data.key === rightSon.data.key) {
            return null;
        }
        return rightSon;
    }

    // go up the tree until I find a node which has right brother
    getMyRightFarBrother(node) {
        let levelsUp = 0;
        let nextNode = node;
        let parent = this.getMyParent(nextNode);
        let rightBrother = this.getMyRightBrother(nextNode);
        console.log('getMyRightFarBrother() BEFORE parent=' + parent + ' rightBrother=' + rightBrother + ' levelsUp=' + levelsUp);
        while (this.getMyParent(nextNode) != null && rightBrother == null) {
            nextNode = parent;
            parent = this.getMyParent(nextNode);
            rightBrother = this.getMyRightBrother(nextNode);
            levelsUp++;
            console.log('getMyRightFarBrother() INSIDE parent=' + parent + ' rightBrother=' + rightBrother + ' levelsUp=' + levelsUp);
        }
        console.log('getMyRightFarBrother() OUT parent=' + parent + ' rightBrother=' + rightBrother + ' levelsUp=' + levelsUp);
        let n = this.getMyRightSon(parent);
        if (n === null)
        {
            this.clearHighlight();
            this._notificationsService.error("Error!", "Can not find right brother...");
            return null;
        }
        n.isHighlighted = true;
        for (let i = 0; i < levelsUp; i++) {
            n = this.getMyLeftSon(n);
            n.isHighlighted = true;
            console.log("getMyRightFarBrother() going down to: n=" + n);
        }
        return n;
    }

    clearHighlight()
    {
        this.m_diagram.startTransaction("no highlighteds");
        this.m_diagram.clearHighlighteds();
        this.m_diagram.commitTransaction("no highlighteds");
    }

    onNodeClicked(node: any) {
        console.log("onNodeClicked() node=" + node);

        // highlight all Links and Nodes coming out of a given Node
        let diagram = node.diagram;
        diagram.startTransaction("highlight");
        // remove any previous highlighting
        diagram.clearHighlighteds();
        // for each Link coming out of the Node, set Link.isHighlighted
        let parent = this.getMyParent(node);
        if (parent === null)
        {
            return;
        }
        parent.isHighlighted = true;
        console.log("onNodeClicked() parent=" + parent);
        let rightSon = this.getMyRightSon(parent);
        if (null != rightSon) {
            console.log("highlight right son: " + rightSon);
            // if this node is I, we need to go up the tree...
            if (rightSon.part.data.key === node.data.key) {
                let brother = this.getMyRightFarBrother(node);
                if (brother != null) 
                {
                  this._notificationsService.success("Succes!", "Found node " + brother.part.data.key);
                }
            }
            else // we found my brother!!!
            {
              this._notificationsService.success("Succes!", "Found node " + rightSon.part.data.key);
              rightSon.isHighlighted = true;
            }

        }
        diagram.commitTransaction("highlight");
    }


    ngAfterViewInit() {
        //(go as any).licenseKey = "...";

        const $ = go.GraphObject.make;  // for conciseness in defining templates

        const myDiagram: go.Diagram = $(go.Diagram, this.element.nativeElement,
            {
                initialContentAlignment: go.Spot.Center,  // center the content
                "undoManager.isEnabled": true,  // enable undo & redo
                layout: $(go.TreeLayout, // specify a Diagram.layout that arranges trees
                    {angle: 90, layerSpacing: 35})
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
                    new go.Binding("text", "key"))
            );

        myDiagram.isReadOnly = true;

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
                        .ofObject())
            );

        myDiagram.addDiagramListener("ObjectSingleClicked",
            (e) => {
                let part = e.subject.part;
                if (!(part instanceof go.Link)) {
                    console.log("Clicked on " + part.data.key);
                }
            });

        // when the user clicks on the background of the Diagram, remove all highlighting
        myDiagram.click = (e) => {
            this.clearHighlight();
        };

        this.m_diagram = myDiagram;

        // create the model data that will be represented by Nodes and Links
        myDiagram.model = new go.GraphLinksModel(
            [
                {key: "A", color: "lightblue"},

                {key: "A_R", color: "orange"},
                {key: "A_L", color: "orange"},

                {key: "A_L_L", color: "orange"},
                {key: "A_L_R", color: "orange"},
                {key: "A_R_L", color: "orange"},
                {key: "A_R_R", color: "orange"},

                {key: "A_L_R_L", color: "orange"},
                {key: "A_L_R_R", color: "orange"},
                {key: "A_L_L_L", color: "orange"},
                {key: "A_L_L_R", color: "orange"},
                {key: "A_R_R_L", color: "orange"},
                {key: "A_R_R_R", color: "orange"},
                {key: "A_R_L_L", color: "orange"},
                {key: "A_R_L_R", color: "orange"},
            ],
            [
                {from: "A", to: "A_L"},
                {from: "A", to: "A_R"},

                {from: "A_L", to: "A_L_L"},
                {from: "A_L", to: "A_L_R"},
                {from: "A_R", to: "A_R_L"},
                {from: "A_R", to: "A_R_R"},

                {from: "A_L_L", to: "A_L_L_L"},
                {from: "A_L_L", to: "A_L_L_R"},
                {from: "A_L_R", to: "A_L_R_L"},
                {from: "A_L_R", to: "A_L_R_R"},
                {from: "A_R_L", to: "A_R_L_L"},
                {from: "A_R_L", to: "A_R_L_R"},
                {from: "A_R_R", to: "A_R_R_L"},
                {from: "A_R_R", to: "A_R_R_R"},
            ]);
    }

}
