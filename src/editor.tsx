import {
    Button,
    Form,
    List,
    Tabs,
} from "antd";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "antd/dist/antd.css";
import ButtonGroup from "antd/lib/button/button-group";
import { AnimationEditor } from "./components/AnimationEditor";
import { SpriteEditor } from "./components/SpriteEditor";

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
        return (
            <BrowserRouter>
                <ButtonGroup>
                    <Button>
                        <Link to='/animation'>animation</Link>
                    </Button>
                    <Button>
                        <Link to='/sprite'>sprite</Link>
                    </Button>
                </ButtonGroup>
                <Routes>
                    <Route path="/animation" element={<AnimationEditor />} />
                    <Route path="/sprite" element={<SpriteEditor />} />
                </Routes>
            </BrowserRouter>
        );
    }
}

createRoot(document.getElementById("root")!).render(<App />);
