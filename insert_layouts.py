import sys

with open('scratch.tsx', 'rb') as f:
    new_layouts = f.read().decode('utf-16')

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Settings, User, Bell } from 'lucide-react';", "Settings, User, Bell, Users } from 'lucide-react';")

idx = content.find('function TutorialOverlay(')
if idx != -1:
    content = content[:idx] + new_layouts + '\n\n' + content[idx:]

old_render = "{difficulty === 'Easy' && <SaasLayout />}"
new_render = """{difficulty === 'Easy' && <SaasLayout />}
            {difficulty === 'Medium' && <MediumLayout />}
            {difficulty === 'Hard' && <HardLayout />}
            {difficulty === 'Nightmare' && <NightmareLayout />}"""
content = content.replace(old_render, new_render)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
