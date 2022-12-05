import {
    Button,
    Form,
    List,
    Tabs,
} from "antd";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes, Navigate } from "react-router-dom";
import "antd/dist/antd.css";
import ButtonGroup from "antd/lib/button/button-group";
import { AnimationEditor } from "./components/AnimationEditor";
import { SpriteEditor } from "./components/SpriteEditor";
import { ShapeEditor } from "./components/ShapeEditor";

export interface SheetInfo {
    name: string;
    resource: string;
    marked: boolean;
    animation: boolean;
    markedName: string;
    animationName: string;
}
class App extends React.Component {
    render() {
        const routes = [
            { path: '/animation', name: 'animation', component: AnimationEditor },
            { path: '/sprite', name: 'sprite', component: SpriteEditor },
            { path: '/shape', name: 'shape', component: ShapeEditor },
        ]
        return (
            <BrowserRouter>
                <ButtonGroup>
                    {routes.map((route) => (
                        <Button>
                            <Link to={route.path}>{route.name}</Link>
                        </Button>
                    ))}
                </ButtonGroup>
                <Routes>
                    {routes.map((route) => (
                        <Route path={route.path} element={React.createElement(route.component)} />
                    ))}
                </Routes>
            </BrowserRouter>
        );
    }
}

createRoot(document.getElementById("root")!).render(<App />);
