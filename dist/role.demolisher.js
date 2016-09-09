var roleDemolisher = {
    
    bodyparts: function(max_energy){
        return [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                MOVE,MOVE,MOVE,MOVE,MOVE,
                HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
                HEAL,HEAL,HEAL,HEAL,HEAL,
                RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,];
    },
    initMemory: function(){
        return {
            role:"demolisher",
            homeFlag:"Flag7",
            targetFlag:"Flag5",
            enemies:["5796f21433e0a1e14244f31d","5796d2083639ae447ee33166"],
            status : 0
        };
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        
        //creep.memory.status = 2;
        if(!creep.memory.status){
            creep.moveTo(Game.flags[creep.memory.homeFlag]);
            var range =  creep.pos.getRangeTo(Game.flags[creep.memory.homeFlag]);
            if(range < 1){
                console.log("Attack ready!");
                creep.memory.status = 1;
            }
        }
        if(creep.memory.status == 1){
            if(creep.room.memory.countCreeps.demolisher >=0)
            {
                console.log("Attacker on the way!");
                creep.memory.status = 2;
            }
        }
        if(creep.memory.status == 2)
        {
            //creep.memory.status = 0;
            creep.moveTo(Game.flags[creep.memory.targetFlag]);
            var range =  creep.pos.getRangeTo(Game.flags[creep.memory.targetFlag]);
            if(range <  1)
            {
                console.log("Attacker start to attack!");
                    creep.memory.status = 3;
            }
        }
        creep.memory.status = 2;
        if(creep.memory.status == 3)
        {
            if(Game.time % 5 == 0)
            {
                creep.say("LONG LIVE");
            }    
            else if(Game.time % 5 == 1)
            {
                creep.say("THE EMPEROR");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("UMINGO");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("...");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("......");
            }
            
            var target = Game.getObjectById(creep.memory.enemies[0]);
            if(target) 
            {
                //creep.move(TOP);
                creep.moveTo(target);
            }
            else if(creep.memory.enemies.length)
            {
                creep.memory.enemies.shift();
            }
            else {
                creep.memory.status = 4;
            }
        }
        
        if(creep.memory.status == 4)
        {
            var target2 = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
            creep.moveTo(target2);
        }
        
        //RANGE ATTACK
        var targetEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        var targetEnemiesStruc = creep.pos.findInRange(FIND_HOSTILE_STRUCTURES, 3);
        if(targetEnemies.length > 0) {
            creep.rangedAttack(targetEnemies[0]);
        }
        else if(targetEnemiesStruc.length > 0) {
            creep.rangedAttack(targetEnemiesStruc[0]);
        }
        else{
            creep.rangedMassAttack();
            
            creep.rangedAttack(Game.getObjectById('579868b7cbde07c62c2e9177'));
        }
        //HEAL
        if(creep.hits < creep.hitsMax)
        {
            creep.heal(creep);
        }
        else 
        {
            var target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: function(object) {
                    return object.hits < object.hitsMax;
                }
            });
            if(target) {
                creep.moveTo(target);
                if(creep.pos.isNearTo(target)) {
                    creep.heal(target);
                }
            }
        }
        
        //creep.move(TOP);
    }
};

module.exports = roleDemolisher;