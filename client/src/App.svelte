<script lang="ts">
	import Router from 'svelte-spa-router';
	import Lobby from "./routes/Lobby.svelte";
	import Board from "./routes/Board.svelte";

	const routes = {
		'/': Lobby,
		'/board': Board,
	};
</script>

<Router {routes} />

<style>
</style>