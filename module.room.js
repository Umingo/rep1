var moduleRoom = {


    /** @param {Room} room **/
    run: function(room) {

        if(Game.time%6 == 1){
            this.spawnRun(room);
        }
        this.towerRun(room);
        this.createJobs(room)
        
        if(Game.time%1000 == 150){
            //this.buildRoom(room);
        }
        if(Game.time%300 == 24){
            this.calcRequiredCreeps(room);
        }

    },
    createJobs: function(room){
        //only look for own rooms since others have no transporters atm ...
        if(this.myRoom(room) && Game.time%10 == 8)
        {
            var pickups = room.find(FIND_DROPPED_RESOURCES,
            {
                filter: (ressource) => 
                {
                    return (ressource.amount > 75)
                }
            });
            if(!room.memory.pickupjobs){
                room.memory.pickupjobs = {};
            }
            for(let pickup_i in pickups){
                let pickup = pickups[pickup_i];
                //already inserted
                if(room.memory.pickupjobs.hasOwnProperty(pickup.id)){
                    continue;
                }
                room.memory.pickupjobs[pickup.id] = pickup.amount;
            }
        }
        
        if(Game.time%500 == 7){
            //reset all jobs. will be inserted next round again!
            //some conflict with pickups on the way ... but who cares ...
            room.memory.pickupjobs = {};
        }
    },
    clearPickupjob:function(room,pickup_id){
        if(room.memory.pickupjobs.hasOwnProperty(pickup_id)){
            delete room.memory.pickupjobs[pickup_id];
        }
    },
    getPickupjob: function(room,capacity){
        
            for(var pickup_id in room.memory.pickupjobs){
                let pickupjob = room.memory.pickupjobs[pickup_id];
               
                if(pickupjob < 0){
                    continue;
                }
                //+50 for time and actual pickupvalue ...
                room.memory.pickupjobs[pickup_id] -= (capacity||0) + 50;
                return pickup_id;
            }
            return null;
        
    },
    calcRequiredCreeps: function(room){
        
        if(!this.myRoom(room)){
            return;
        }
            var shouldCreeps = {
                "upgrader" : 1,
                "builder" : 2,
                "bee" : 0,
                "distributer" : 2,
                "scavenger" : 4,
                "claimer" : 0,
                "transporter" : 0,
                harvester2 : 0,
                attacker:0,
                demolisher:0,
            }
            //if(Game.time > 12415010 +1100) shouldCreeps.harvester2 = 20;
            room.memory.shouldCreeps = shouldCreeps;
            //count container
            
            var sources = room.find(FIND_SOURCES);
            var containers = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER));
                }
            });
            var extensions = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION));
                }
            });
            var constructions = room.find(FIND_MY_CONSTRUCTION_SITES);
            if(constructions.length)
            {
                room.memory.shouldCreeps.builder = 1;
                if(constructions.length > 5){
                    room.memory.shouldCreeps.builder = 2;
                }
                if(constructions.length > 10){
                    room.memory.shouldCreeps.builder = 3;
                }
            }
            else
            {
                room.memory.shouldCreeps.builder = 0;
            }
            room.memory.shouldCreeps.scavenger = Math.min(sources.length,containers.length);
            if(room.storage)
            {
                room.memory.shouldCreeps.transporter  = sources.length;
                room.memory.shouldCreeps.upgrader = Math.ceil((10*room.storage.store[RESOURCE_ENERGY]) / room.storage.storeCapacity);
                room.memory.shouldCreeps.distributer = 1;
            }
            else 
            {
                if(room.controller && room.controller.level <= 4){
                    for(var i in room.memory.shouldCreeps){
                        room.memory.shouldCreeps[i] = 0;
                    }
                    var source_distance = room.controller.pos.getRangeTo(sources[0].pos);
                    console.log("CONTR TO SOURCE: " + source_distance);
                    
                    room.memory.shouldCreeps.bee = sources.length * (2 + Math.floor(source_distance /15));
                    room.memory.shouldCreeps.scavenger = Math.min(sources.length,containers.length);
                }
                else {
                    room.memory.shouldCreeps.upgrader = sources.length;
                    room.memory.shouldCreeps.transporter  = 0;
                    room.memory.shouldCreeps.distributer = sources.length;
                }
            }
            
    },
    
    spawnRun:function(room){
        
        var role = global.roles;
        if(!this.myRoom(room))
        {
            return;
        }
        var spawns = room.find(FIND_MY_SPAWNS);
        if(spawns.length)
        {
            for(var spawnname in spawns)
            {
                var spawn = spawns[spawnname];
                if(spawn.spawning != null)
                {
                    
                    continue;
                }
                var targetheals = spawn.pos.findInRange(FIND_MY_CREEPS, 1,{
                     filter: (creep2) => (creep2.ticksToLive < 1200)
                });
                if(targetheals.length > 0) {
                    spawn.renewCreep(targetheals[0]);
                }
                
                if(spawn.room.energyAvailable < 300)
                { 
                    //console.log("energy < 300");
                    continue;
                }
                
                if(!room.memory.countCreeps || !room.memory.countCreeps.distributer)
                {
                    if(!room.memory.countCreeps.hasOwnProperty("bee") || room.memory.countCreeps.bee < 2)
                    {
                        console.log("Create Emergency Bee");
                        if(spawn.createCreep(global.roles.bee.bodyparts(spawn.room.energyCapacityAvailable,spawn.room.energyAvailable),null,global.roles.bee.initMemory()) == OK){
                            continue;
                        }
                    }
                }
                
            
                
                for(var rolename_i in room.memory.shouldCreeps)
                {
                    if(rolename_i != "demolisher"){
                        //continue;
                    }
                    var soll_value = room.memory.shouldCreeps[rolename_i];
                    var is_value = room.memory.countCreeps.hasOwnProperty(rolename_i) ? room.memory.countCreeps[rolename_i]:0;
                    var role_now = role[rolename_i];
                    
                    
                    //console.log("check: " + rolename_i + " " + soll_value + " + " + is_value);
                    if(is_value < soll_value)
                    {
                        var bodyparts = role_now.bodyparts(spawn.room.energyCapacityAvailable,spawn.room.energyAvailable);
                        if(bodyparts != null)
                        {
                            var result_spawn = spawn.canCreateCreep(bodyparts);
                            if(result_spawn == OK)
                            {
                                console.log(spawn.name + " creates " + rolename_i);
                                spawn.createCreep(bodyparts,rolename_i.substr(0,2) + Math.floor(Math.random() * 12500),role_now.initMemory());
                                spawn.room.memory.countCreeps[rolename_i] += 1;
                                break;
                            }
                            else {
                                //console.log(spawn.name + " result: " + result_spawn+" wants: " + rolename_i + " energy: " + spawn.room.energyAvailable + " max_energy: " + spawn.room.energyCapacityAvailable);
                                
                            }
                        }
                    }
                }
            }
        }
    },
    
    towerRun:function(room){
        
        if(!this.myRoom(room) || (!!room.memory.towercheck_time && room.memory.towercheck_time > Game.time)){
            return;
        }
        var towers = room.find(FIND_MY_STRUCTURES,{filter: (object) => object.structureType == STRUCTURE_TOWER});
        var hostiles = room.find(FIND_HOSTILE_CREEPS);
        var closestDamagedStructure = null;
        var checkIfRepairNeeded = function(structure){
            return (structure.hits < 90000 && structure.hits < structure.hitsMax*0.8) || 
                   (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax*0.9);
                   
        }
        if(!room.memory.repairNow){
            
            var tower_repairs = room.find(FIND_STRUCTURES, 
                    {
                        filter: checkIfRepairNeeded
                    });
            if(tower_repairs.length){
                room.memory.repairNow = tower_repairs[0].id;
            }
        }
        if(room.memory.repairNow){
            closestDamagedStructure = Game.getObjectById(room.memory.repairNow);
            if(!checkIfRepairNeeded(closestDamagedStructure)){
                room.memory.repairNow = null;
            }
        }
        
        if(!hostiles.length && !closestDamagedStructure){
            room.memory.towercheck_time = Game.time + 5+ Math.ceil(15*Math.random());
        }
        else {
        
            for(let i = 0;towers.length && i < towers.length;i++)
            {
                let tower = towers[i];
                let closestHostile = null;
                if(hostiles.length){
                    closestHostile = hostiles[0];
                    //tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                }
                if(closestHostile) 
                {
                    tower.attack(closestHostile);
                }
                else if((Game.time%(1*towers.length)) == i)
                {
                    if(closestDamagedStructure) 
                    {
                      tower.repair(closestDamagedStructure);
                    }
                }
            }
        }
    },
    
    buildRoom:function(room){
        
        if(!this.myRoom(room) || Game.cpu.tickLimit < 500){
            return;
        }
        
        var sources = room.find(FIND_SOURCES);
        
        var extensions = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_EXTENSION));
            }
        });
        var towers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_TOWER));
            }
        });
        var spawns = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_SPAWN));
            }
        });
        let goals = _.map(room.find(FIND_SOURCES), function(source) {  
            // We can't actually walk on sources-- set `range` to 1
            return { pos: source.pos, range: 1 };
          });
      
      let roadPathes =_.map(goals, function(goal){ 
            return PathFinder.search(
                room.controller.pos, goal,
                {
                  plainCost: 1,
                  swampCost: 1,
                });
          });
      let roadMinPath = _.min(roadPathes, function(roadPath){ return roadPath.path.length; });
      if(spawns.length == 0){
          console.log("Search for Spawnpoint!");
          for(var path_i = roadMinPath.path.length-1; path_i > 4;path_i--){
              
              //if(path_i < 1 || path_i > roadMinPath.path.length-4){
                //  continue;
             // }
              var path_step = roadMinPath.path[path_i];
              var path_step_next = roadMinPath.path[path_i+1];
              var path_step_pre = roadMinPath.path[path_i-1];
              if(!path_step_next ||  !path_step_pre){
                  continue;
              }
              
              let is_good_spawnpoint_left = true;
              let is_good_spawnpoint_right = true;
              let is_good_spawnpoint_top = true;
              let is_good_spawnpoint_bot = true;
              for(let x = -1;x <= 1;x++){
                  for(let y = -1;y <= 1;y++){
                      let p_x = path_step.x+x;
                      let p_y = path_step.y+y;
                      is_good_spawnpoint_left = is_good_spawnpoint_left && (Game.map.getTerrainAt(p_x-1,p_y,room.name) != "wall");
                      is_good_spawnpoint_right = is_good_spawnpoint_right && (Game.map.getTerrainAt(p_x+1,p_y,room.name) != "wall");
                      is_good_spawnpoint_top = is_good_spawnpoint_left && (Game.map.getTerrainAt(p_x,p_y-1,room.name) != "wall");
                      is_good_spawnpoint_bot = is_good_spawnpoint_right && (Game.map.getTerrainAt(p_x,p_y+1,room.name) != "wall");
                      
                  }   
              }
              if(is_good_spawnpoint_left || is_good_spawnpoint_right || is_good_spawnpoint_top || is_good_spawnpoint_bot)
              {
                  let pos = {};
                  if(is_good_spawnpoint_left){
                      pos.x = path_step.x -1;
                      pos.y = path_step.y;
                      if((pos.x == path_step_pre.x && pos.x == path_step_pre.y) || (pos.x == path_step_next.x && pos.x == path_step_next.y)){
                          pos = {};
                      }
                  }
                  if(is_good_spawnpoint_right){
                      pos.x = path_step.x + 1;
                      pos.y = path_step.y;
                      if((pos.x == path_step_pre.x && pos.x == path_step_pre.y) || (pos.x == path_step_next.x && pos.x == path_step_next.y)){
                          pos = {};
                      }
                  }
                  if(is_good_spawnpoint_top){
                      pos.x = path_step.x;
                      pos.y = path_step.y-1;
                      if((pos.x == path_step_pre.x && pos.x == path_step_pre.y) || (pos.x == path_step_next.x && pos.x == path_step_next.y)){
                          pos = {};
                      }
                  }
                  if(is_good_spawnpoint_bot){
                      pos.x = path_step.x;
                      pos.y = path_step.y+1;
                      if((pos.x == path_step_pre.x && pos.x == path_step_pre.y) || (pos.x == path_step_next.x && pos.x == path_step_next.y)){
                          pos = {};
                      }
                  }
                  if(pos.x && pos.y){
                      console.log("CREATE SPAWN");
                      console.log(JSON.stringify(pos));
                      room.createConstructionSite(step.x,step.y, STRUCTURE_SPAWN);
                      break;
                  }
                  
              }
          }
      }
        
        for(let roadPathes_i in roadPathes)
        {
            //no tower? focus on one source!
            if(towers.length < 1 && roadPathes_i > 0){
                continue;
            }
            var path = roadPathes[roadPathes_i];
            if(towers.length < 1){
                //focus on the shortest path 
                path = roadMinPath;
            }
            
                //build road from source to controller with enough place for storage 
                path.path.forEach(function (step, index, array) 
                {
                    if(index > 2 && index < array.length -2)
                    {
                        room.createConstructionSite(step.x,step.y, STRUCTURE_ROAD);
                    }
                });
                
                var container_position = room.getPositionAt(path.path[path.path.length-2].x,path.path[path.path.length-2].y);
                //var is_built = false;
                //var found_done = container_position.lookFor(LOOK_STRUCTURES);
                //var found_construction = container_position.lookFor(LOOK_CONSTRUCTION_SITES);
                //is_built = is_built || _.filter(found_done,(structure) => structure.structureTypestring == STRUCTURE_CONTAINER).length);
                //is_built = is_built || _.filter(found_construction,(construction) => construction.structureTypestring == STRUCTURE_CONTAINER).length);
                //if(!is_built){
                var err_code = container_position.createConstructionSite(STRUCTURE_CONTAINER);
                
        }
        if(!room.storage){
            let store_x = 0;
            let store_y = 0;
            _.each(roadPathes,function(value,key,list){
                store_x += value.path[Math.min(value.path.length-1,3)].x;
                store_y += value.path[Math.min(value.path.length-1,3)].y;
            });
            store_x = Math.round(store_x / roadPathes.length);
            store_y = Math.round(store_y / roadPathes.length);
            let storage_position = room.getPositionAt(store_x,store_y);
            storage_position.createConstructionSite(STRUCTURE_STORAGE);
        }
        
        
        //if(pathes.con2sto != null)
        //{
        //    pathes.con2sto.forEach(build_roads);
        //}
        
        //var constructed_containers = room.find(FIND_MY_CONSTRUCTION_SITES,
        // {
        //            filter: (structure) =>    (structure.structureType == STRUCTURE_CONTAINER)
        // });
        // if(constructed_containers.length == 0)
        // {
        /*
            for(var sources_i in sources)
            {
                var pathkey = "source_controller" + sources_i;
                var source = sources[sources_i];
                //build 1 container for each source
                if(!pathes[pathkey]){
                    continue;
                }
                
                var container_position = room.getPositionAt(pathes[pathkey][1].x,pathes[pathkey][1].y);
                //var is_built = false;
                //var found_done = container_position.lookFor(LOOK_STRUCTURES);
                //var found_construction = container_position.lookFor(LOOK_CONSTRUCTION_SITES);
                //is_built = is_built || _.filter(found_done,(structure) => structure.structureTypestring == STRUCTURE_CONTAINER).length);
                //is_built = is_built || _.filter(found_construction,(construction) => construction.structureTypestring == STRUCTURE_CONTAINER).length);
                //if(!is_built){
                var err_code = container_position.createConstructionSite(STRUCTURE_CONTAINER);
                //console.log("Build Container: " + err_code);
                //}
            }
        // }
        */
    }
    ,
    
    
    
    /** @param {Room} room **/
    myRoom:function(room) {
        return room.controller && room.controller.my;
    }
};

module.exports = moduleRoom;