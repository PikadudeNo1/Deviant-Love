<script>
import lookUpDeviant from "../lookUpDeviant.esm.js"
import { onMount } from 'svelte';

export let deviant;
let img;
let loading = true;

onMount(() => {
	if (deviant.avatar) {
		img.src = deviant.avatar;
	} else {
		lookUpDeviant(deviant.name).then( (results) => {
			if (!results.avatar) { throw false; }
			img.src = deviant.avatar = results.avatar;
		} ).catch( () => {
			loading = false;
		} );
	}
});
</script>

<a class="avatar {loading ? 'loading' : ''}" href="{deviant.baseURL}">
	<img bind:this={img} width="50" height="50" alt="{deviant.name}"
		on:load="{() => loading = false}" on:error="{() => loading = false}">
</a>