import json
g = json.load(open('graphify-out/graph.json'))
print(f'Graph OK: {len(g["nodes"])} nodes, {len(g["links"])} edges')
