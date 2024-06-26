import React from "react";
import { useEffect, useState } from "react";

import s from "./projectid.module.scss";
import { useRouter } from "next/router";
import { useAuth } from "@/authentication/authcontext";
import { CVAR } from "@/utils/constant";
import Project from "@/models/project";
import Loader from "@/components/loader/loader";
import { CreateProjectFormData } from "@/validation/form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema } from "@/validation/schema";
import Input from "@/components/input/input";
import Button from "@/components/button/button";
import ImageInput from "@/components/image/image";
import { getDaysUntilExpiry } from "@/utils/conversion";
import { openSTXTransfer } from '@stacks/connect';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { AnchorMode, PostConditionMode } from '@stacks/transactions';


export default function Projects() {
    const router = useRouter();
    const { projectuid } = router.query;

    const { user, raiser } = useAuth();
    const [project, setProject] = useState<Project>();
    
    let [loading, setLoading] = useState(true);
    let [amount, setAmount] = useState(0);
    let [funding, setFunding] = useState(false);
    async function fund() {

        if (!project) { return; }

        openSTXTransfer({
            network: new StacksMainnet(), // which network to use; use `new StacksMainnet()` for mainnet
            anchorMode: AnchorMode.Any, // which type of block the tx should be mined in

            recipient: project.ownerstacksaddress, // which address we are sending to
            amount: (amount * 1000000).toString(), // amount to send in microstacks
            memo: 'funding', // optional; a memo to help identify the tx

            onFinish: async (response) => {
                // WHEN user confirms pop-up
                console.log(response.txId); // the response includes the txid of the transaction

                // update the project backend
                const updateres = await fetch(`${CVAR}/projects/update-project-fund`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "publickey": `${raiser?.publickey}`,
                        "signature": `${raiser?.signature}`
                    },
                    body: JSON.stringify({
                        projectuid,
                        amount: amount 
                    })
                });

            },
            onCancel: () => {
                // WHEN user cancels/closes pop-up
                console.log('User canceled');
            },
        });
    }

    async function getProject() {
        setLoading(true);
        console.log("getting project");
        const res = await fetch(`${CVAR}/projects/get-project?projectuid=${projectuid}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "publickey": `${raiser?.publickey}`,
                "signature": `${raiser?.signature}`
            },
        });

        const data = await res.json();
        console.log(data);
        const proj = data.project as Project;
        setProject(proj);
        setLoading(false);
    }

    useEffect(() => {
        if (projectuid) {
            getProject();
        }
    }, [user, projectuid])

    if (loading) { return <Loader /> }

    if ((project && !project.deployed) || !projectuid) {
        return (<main className={s.notdeployed}>project issue.</main>)
    }

    return (
        <main className={s.projectid}>
            {
                project &&
                <div className={s.project}>
                    <div className={s.info}>
                        <div className={s.left}>
                            <div className={s.projectname}>{project.projectname}</div>
                            <div className={s.punchline}>{project.projectpunchline}</div>
                            <div className={s.creator}>stx.{project.ownerstacksaddress}</div>
                        </div>
                        {
                            user && <div className={s.right}>
                            {
                                !funding ? <>
                                    <button className={s.dao} onClick={() => router.push(`/projects/${project.projectuid}/dao`)}>
                                        dao!
                                    </button>
                                    <button className={s.fund} onClick={()=> setFunding(true)}>fund!</button>
                                </> : 
                                <div className={s.funding}>
                                    <input type="number" placeholder="amount" 
                                        value={amount} 
                                        onChange={(e) => setAmount(parseInt(e.target.value))}
                                    />
                                    <button
                                        onClick={fund} 
                                    >fund</button>
                                </div>
                            }
                        </div>
                        }
                    </div>
                    <div className={s.content}>
                        <img src={project.projectdisplayimage} alt={project.projectname} />
                        <div className={s.details}>
                            <div className={s.detail}>
                                <label>description:</label>
                                <p>{project.projectdescription}</p>
                            </div>
                            <div className={s.detail}>
                                <label>duration:</label>
                                <p>{project.expiry}</p>
                                <p>ending in {getDaysUntilExpiry(project.expiry)} days from now</p>
                            </div>
                            <div className={s.detail}>
                                <label>raised:</label>
                                <div className={s.raised}>
                                    <div className={s.bar}>
                                        <div className={s.fill} style={{
                                            width: project.amountraised === 0 ? "3%" : `${(project.amountraised / project.fundinggoal) * 100}%`
                                        }}>
                                        </div>
                                    </div>
                                    <p>{project.amountraised} / {project.fundinggoal} STX</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={s.milestones}>
                        {
                            project.milestones.map((milestone, index) => {
                                return (
                                    <div className={s.milestone} key={index}>
                                        <div className={s.mile}>
                                            <div>milestone</div>
                                            <label>{index + 1}</label></div>
                                        <div className={s.stone}>
                                            <div className={s.name}>{milestone.milestonename}</div>
                                            <div className={s.desc}>{milestone.milestonedescription}</div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>


                </div>
            }
        </main>
    )
} 