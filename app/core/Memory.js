export default function Memory() {
    if (typeof Memory.instance === 'object') {
        return Memory.instance
    } else {
        Memory.instance = this;     
        Memory.instance.markers  = [];
        //Memory.instance.stikers  = [];
        Memory.instance.env = "LIVE";
        // Memory.instance.env = "DEV";
        return this;
    }
}