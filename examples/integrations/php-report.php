<?php

// Call ASCII Graphs from PHP through its JSON stdin bridge.
$request = [
    'chart' => [
        'type' => 'progress',
        'title' => 'PHP release readiness',
        'data' => [
            ['label' => 'Build', 'value' => 82, 'target' => 90],
            ['label' => 'Tests', 'value' => 96, 'target' => 95],
            ['label' => 'Docs', 'value' => 71, 'target' => 100],
        ],
    ],
    'layout' => ['width' => 48, 'charset' => 'unicode'],
    'output' => ['format' => 'text'],
];

$command = ['node', __DIR__ . '/render-json.mjs'];
$pipes = [];
$process = proc_open($command, [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
], $pipes);

if (!is_resource($process)) {
    throw new RuntimeException('Unable to start the ASCII Graphs bridge.');
}

fwrite($pipes[0], json_encode($request, JSON_THROW_ON_ERROR));
fclose($pipes[0]);
$output = stream_get_contents($pipes[1]);
$error = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$status = proc_close($process);

if ($status !== 0) {
    throw new RuntimeException(trim($error));
}

echo $output;
