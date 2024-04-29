import { world, system } from '@minecraft/server';
import {biomeFinder, BiomeBlocks, biomeBlockFinder} from "playerDependent"
import {ModalFormData,ActionFormData} from "@minecraft/server-ui";


var startZ = -837
var startX = -140
var maxX = 140
var maxZ = -500
var curX = startX
var curZ = startZ
var scanHeight=68
var PlayerMaping
var voidCommand = "fill ~ 0 ~ ~ 127 ~ air"
var fillLoop=null
world.afterEvents.itemUse.subscribe(event=>{
	controlStick(event)
})
function mapBiomes(){
	fillLoop =system.runInterval(() => {
		let itemName = PlayerMaping.getComponent("minecraft:equippable").getEquipmentSlot("Mainhand").typeId
		itemName=itemName.replace("minecraft:","")
		if(itemName != "stick"){
			PlayerMaping.runCommand("setblock ~~-1~ "+ biomeBlockFinder(PlayerMaping))
			PlayerMaping.runCommand(voidCommand)
			curX+=1
			if(curX>=maxX){
				curX=startX
				curZ+=1
			}
			if (curZ<=maxZ){
				PlayerMaping.teleport({x:curX,y:scanHeight,z:curZ})
				
			}else{
				system.clearRun(fillLoop)
			}
		}
	},2);
}
function controlStick(event){
	let player = event.source;
	let itemName = event.itemStack.typeId.replace("minecraft:", "");
	let itemTag = event.itemStack.nameTag;
	if(itemName == "stick" && fillLoop){
		system.clearRun(fillLoop)
		fillLoop=null
	}
	if(itemName == "stick" && (itemTag == "control")){
		showMenu(player)
	}
	
	if(itemName == "stick" && (itemTag == "help")){
		showHelp(player)
	}
	if(itemName == "stick" && (itemTag == "debug")){
		printBiome(player)
	}
}
function printBiome(player){
		let display=player.onScreenDisplay
	display.setActionBar({text:"\u00A7cBiome: \u00A7e"+biomeFinder(player)})
}
function showHelp(player){
	let titleFormat = "\u00A7d";
	let subtitleFormat = "\u00A73";
	let itemFormat = "\u00A7a";
	let bodyFormat = "\u00A7r";
	let indentSize = "    ";
	let nextLine = '\n';
	let message = titleFormat+"Help:"+nextLine
	message += bodyFormat+"Read through this to see how things work." + nextLine
	message += subtitleFormat+"Use:"+nextLine
	message += bodyFormat+indentSize+"A stick named control allows you to access the main menu." + nextLine
	message += bodyFormat+indentSize+"Entering a start X/Z and a Max X/Z along with a Z heigh will define where you want to detect biomes." + nextLine
	message += bodyFormat+indentSize+"Void will set if you want the world voided as biomes are detected." + nextLine
	message += bodyFormat+indentSize+"When you confirm your settings, nothing will happen until you switch your inventory away from the stick. selecting a stick will pause the process. Using it will cancel the process." + nextLine
	message += bodyFormat+indentSize+"You will teleport through every block of the area, the player location is used to detect the biome." + nextLine
	message += bodyFormat+indentSize+"Naming a stick Debug will print the biome you are in when used." + nextLine
	message += subtitleFormat+"Biome Block Defintions:"+nextLine
	for (const [biome, block] of Object.entries(BiomeBlocks())) {
		message += bodyFormat+indentSize+biome+": "+block+nextLine
	}
	let confirmMessage = new ActionFormData()
		.body(message)
		.button("Control Menu")
		.button("Cancel")
	confirmMessage.show(player).then((response) => {
			switch(response.selection){
				case 0 :
					showMenu(player)
					break;
				case 1 :
					break;
			}
	});
}
function showMenu(player){
	let controlForm = new ModalFormData()
		.title("Setup Maping")
		.textField("Start X","coordinate")
		.textField("Start Z","coordinate")
		.textField("Stop X","coordinate")
		.textField("Stop Z","coordinate")
		.textField("Y Height","coordinate","68")
		.toggle("Void",true)
	controlForm.show(player).then((response) => {
		startX = Number(response.formValues[0])
		startZ = Number(response.formValues[1])
		maxX = Number(response.formValues[2])
		maxZ = Number(response.formValues[3])
		if (startX>maxX){
			startX = maxX
			maxX = Number(response.formValues[0])
		}
		if(startZ>maxZ){
			startZ = maxZ
			maxZ = Number(response.formValues[1])
		}
		curZ=startZ
		curX=startX
		scanHeight = Number(response.formValues[4])
		PlayerMaping=player
		let time = (startX-maxX)*(startZ-maxZ)/10
		voidCommand = "fill ~ ~-1 ~ ~ ~-1 ~ air"
		if (response.formValues[5]){
			switch(player.dimension.id){
				case "minecraft:nether":
					voidCommand = "fill ~ 0 ~ ~ 127 ~ air"
					break;
				case "minecraft:the_end":
					voidCommand = "fill ~ 0 ~ ~ 127 ~ air"
					break
				case "minecraft:overworld":
					voidCommand = "fill ~ -63 ~ ~ 319  ~ air"
					break
			}
			
		}
		displayWarning(player, time)
	})
}
function displayWarning(player, time){
	let confirmMessage = new ActionFormData()
		.body("this operation will take "+ time.toString() + " Seconds \n\r if you hold a stick the movement will pause. if you use a stick it will stop")
		.button("continue")
		.button("Cancel")
	confirmMessage.show(player).then((response) => {
			switch(response.selection){
				case 0 :
					mapBiomes()
					break;
				case 1 :
					break;
			}
	});
}