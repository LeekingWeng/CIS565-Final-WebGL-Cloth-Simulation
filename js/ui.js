
var UI_cfg = function () {

    var controls = {
        gui: null,
        "Speed Up": 1,
        "Render": 0,
        "Material":0,

        "Cloth Dimension": 50,
        "Particle Mass": 0.1,
        "Time Step": 0.003,
        "Ks String": 850.0,
        "Ks Shear": 850.0,
        "Ks Bend": 2050.0,
        "Kd String": 0.25,
        "Kd Shear": 0.25,
        "Kd Bend":0.25,

        "pause": false,

        "Rigidbody":-1,
        "Wind": false,
        "Wind Force": 0.5,
        "edge 1": false,
        "edge 2": false,
        "edge 3": false,
        "edge 4": false,
        "pin 1": true,
        "pin 2": true,
        "pin 3": false,
        "pin 4": false,
    };

    controls.start = function () {
        var startEvent = new CustomEvent('start-simulation', null);
        window.dispatchEvent(startEvent);
    }

    controls.step = function () {
        var stepEvent = new CustomEvent('step-simulation', null);
        window.dispatchEvent(stepEvent);
    }

    this.getRenderMode = function () {
        return controls['Render'];
    };

    this.getRenderMaterial = function () {
        return controls['Material'];
    };

    this.getRigid = function () {
        return controls['Rigidbody'];
    };

    this.getClothDim = function () {
        return controls['Cloth Dimension'];
    };

    this.getParticleMass = function () {
        //return 0.1;
        return controls['Particle Mass'];
    };

    this.getTimeStep = function () {
        return controls['Time Step'];
    };

    this.getKsString = function () {
        return controls['Ks String'];
    };
    this.getKsShear = function () {
        return controls['Ks Shear'];
    };
    this.getKsBend = function () {
        return controls['Ks Bend'];
    };

    this.getKdString = function () {
        return controls['Kd String'];
    };
    this.getKdShear = function () {
        return controls['Kd Shear'];
    };
    this.getKdBend = function () {
        return controls['Kd Bend'];
    };
    this.getWindForce = function () {
        if (controls['Wind']) return controls['Wind Force'];
        return 0.0;
    }

    this.getEdge = function () {
        var result = 0;
        if (controls['edge 1']) result += 8;
        if (controls['edge 2']) result += 4;
        if (controls['edge 3']) result += 2;
        if (controls['edge 4']) result += 1;
        return result;
    };
    this.getPin1 = function () {
        if (controls['pin 1'])
            return 1.0;
        return -1.0;
    };
    this.getPin2 = function () {
        if (controls['pin 2'])
            return 1.0;
        return -1.0;
    };
    this.getPin3 = function () {
        if (controls['pin 3'])
            return 1.0;
        return -1.0;
    };
    this.getPin4 = function () {
        if (controls['pin 4'])
            return 1.0;
        return -1.0;
    };

    this.getPause = function () {
        return controls['pause'];
    }
    this.setPause = function (value) {
        controls['pause'] = value;
    }

    this.getSpeedUp = function () {
        return controls['Speed Up'];
    }

    this.init = function () {
        //cfg = new Cfg();

        controls.gui = new dat.GUI();

        var Simulation_Settings = controls.gui.addFolder('Simulation_Settings');

        Simulation_Settings.add(controls, "Render", {
            'Points': 0,
            'Triangle':1,
        });
        Simulation_Settings.add(controls, "Material", {
            'Blinn-Phong': 0,
            'Debug:Position': 1,
            'Debug:Normal': 1,
        });
        Simulation_Settings.add(controls, "Cloth Dimension");
        Simulation_Settings.add(controls, "Particle Mass");
        Simulation_Settings.add(controls, "Time Step");

        Simulation_Settings.add(controls, "Ks String");
        Simulation_Settings.add(controls, "Ks Shear");
        Simulation_Settings.add(controls, "Ks Bend");

        Simulation_Settings.add(controls, "Kd String");
        Simulation_Settings.add(controls, "Kd Shear");
        Simulation_Settings.add(controls, "Kd Bend");

       
        var Interaction_Folder = controls.gui.addFolder('Interaction_Folder');
        Interaction_Folder.add(controls, "Rigidbody", {
            'None':     -1,
            'Sphere':    0,
        })
        Interaction_Folder.add(controls, "Wind");
        Interaction_Folder.add(controls, "Wind Force");

        var EdgeFolder = Interaction_Folder.addFolder('Edges');
        EdgeFolder.add(controls, "edge 1");
        EdgeFolder.add(controls, "edge 2");
        EdgeFolder.add(controls, "edge 3");
        EdgeFolder.add(controls, "edge 4");
        var PinFolder  = Interaction_Folder.addFolder('Pins');
        PinFolder.add(controls, "pin 1");
        PinFolder.add(controls, "pin 2");
        PinFolder.add(controls, "pin 3");
        PinFolder.add(controls, "pin 4");

        var Action_Folder = controls.gui.addFolder('Action_Folder');
        Action_Folder.add(controls, "start");
        Action_Folder.add(controls, "pause");
        Action_Folder.add(controls, "step");
        Action_Folder.add(controls, "Speed Up").step(1);

        Action_Folder.open();

    };
}
