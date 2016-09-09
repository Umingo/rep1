var role = {};
var rolebee = require('role.bee');
var roleupgrader = require('role.upgrader');
var rolebuilder = require('role.builder');
var rolescavenger = require('role.scavenger');
var roledistributer = require('role.distributor');
var roleclaimer = require('role.claimer');
var roleharvester2 = require('role.harvester2'); 
var roletransporter = require('role.transporter');
var roleattacker = require('role.attacker');
var roledemolisher = require('role.demolisher');
var moduleRoom = require('module.room');
global.moduleRoom = moduleRoom;

role.bee = rolebee;
role.upgrader = roleupgrader;
role.builder = rolebuilder;
role.scavenger = rolescavenger;
role.distributer = roledistributer;
role.claimer = roleclaimer;
role.harvester2 = roleharvester2;
role.transporter = roletransporter;
role.attacker = roleattacker;
role.demolisher = roledemolisher;
global.roles = role;


module.exports.loop = function () {
    
    //cleanup memory!
    if(Game.time%100 < 1)
    {
        for(var i in Memory.creeps) 
        {
            if(!Game.creeps[i]) 
            {
                delete Memory.creeps[i];
            }
        }
        for(var roomname in Game.rooms)
        {
           
        }
    }
    
    //START COUNT CREEPS PER ROOM
    
    if(Game.time%20 == 2)
    {
        Memory.globalCreeps = {};
        for(var rolename_i in global.roles)
        {
            Memory.globalCreeps[rolename_i] = 0;
        }
        for(var roomname in Game.rooms)
        {
            var room = Game.rooms[roomname];
            room.memory.countCreeps = {};
        }
            
        for(var creepname in Game.creeps) 
        {
            var creep = Game.creeps[creepname];
            var room = creep.room;
            var rolename = creep.memory.role;
            if(role.hasOwnProperty(rolename))
            {
                if(!room.memory.countCreeps.hasOwnProperty(rolename))
                {
                    room.memory.countCreeps[rolename] = 0;
                }   
                if(!Memory.globalCreeps.hasOwnProperty(rolename))
                {
                    Memory.globalCreeps[rolename] = 0;
                }
                
                //do not count near dead creeps ...
                if(creep.spawning || creep.ticksToLive > 50)
                {
                    room.memory.countCreeps[rolename]++;
                    Memory.globalCreeps[rolename]++;
                }
                
                //var elapsed = Math.floor(1000 * (Game.cpu.getUsed() - startCpu));
                //console.log('Creep '+name+' has used '+elapsed+' CPU time');
            }
        }
        
        for(var roomname in Game.rooms)
        {
            var room = Game.rooms[roomname];
            room.memory.countCreeps["harvester2"] = (Memory.globalCreeps["harvester2"]);
            room.memory.countCreeps["claimer"] = Memory.globalCreeps["claimer"];
            room.memory.countCreeps["attacker"] = Memory.globalCreeps["attacker"];
        }
    }
    
    //console.log(JSON.stringify(Memory.rooms));
    //END COUNT CREEPS PER ROOM
    
         
    for(var roomname in Game.rooms)
    {
        
        
        var room = Game.rooms[roomname];
        var creeps = room.find(FIND_MY_CREEPS);
        //console.log("Room: " + roomname + ": " + Game.cpu.getUsed());
        for(var creepname in creeps) 
        {
            var creep = creeps[creepname];
            var rolename = creep.memory.role;
            if(global.roles.hasOwnProperty(rolename))
            {
                //var startCpu = Game.cpu.getUsed();
                if(!creep.spawning)
                {
                    try
                    {
                        global.roles[rolename].run(creep);
                    }
                    catch(e)
                    {
                        console.log("Error at " + rolename);
                        console.log(e);
                        console.log(e.stack);
                    }
                }
            }
            //console.log("Creep: " + rolename + " " + creep.name +": " + Game.cpu.getUsed());
        }
        
        moduleRoom.run(room);
    
    }
    if(Game.time % 10 == 0){
        console.log("#"+Game.time % 1000+" CPU BUCKET:" + Game.cpu.bucket);
    }
   
   
    
}