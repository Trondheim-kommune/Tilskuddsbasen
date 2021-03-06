"""removed tables users, persons and organisations

Revision ID: 50a942a618ca
Revises: 2185ea06cb24
Create Date: 2014-10-02 14:12:09.481057

"""

# revision identifiers, used by Alembic.

revision = '50a942a618ca'
down_revision = '2185ea06cb24'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('soknader_saksbehandler_id_fk', 'soknader')
    op.drop_constraint('soknader_organisation_id_fkey', 'soknader')
    op.drop_constraint('soknader_person_id_fkey', 'soknader')
    op.drop_table('users')
    op.drop_table('organisations')
    op.drop_table('persons')

    op.alter_column('soknader', 'saksbehandler_id', type_=sa.String)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('persons',
    sa.Column('id', sa.INTEGER(), server_default="nextval('persons_id_seq'::regclass)", nullable=False),
    sa.Column('uri', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name=u'persons_pkey')
    )
    op.create_table('organisations',
    sa.Column('id', sa.INTEGER(), server_default="nextval('organisations_id_seq'::regclass)", nullable=False),
    sa.Column('uri', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name=u'organisations_pkey')
    )
    op.create_table('users',
    sa.Column('id', sa.INTEGER(), server_default="nextval('users_id_seq'::regclass)", nullable=False),
    sa.Column('uri', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name=u'users_pkey')
    )

    op.create_foreign_key('soknader_organisation_id_fkey', 'soknader', 'organisations', ["organisation_id"], ["id"])
    op.create_foreign_key('soknader_person_id_fkey', 'soknader', 'persons', ["person_id"], ["id"])
    op.create_foreign_key('soknader_saksbehandler_id_fk', 'soknader', 'users', ["saksbehandler_id"], ["id"])

    ### end Alembic commands ###
